import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodTransaction } from '../../orders/models/foodTransaction.model.js';
import { FoodDeliveryWithdrawal } from '../models/foodDeliveryWithdrawal.model.js';
import { FoodDeliveryCashDeposit } from '../models/foodDeliveryCashDeposit.model.js';
import { FoodDeliveryPartner } from '../models/deliveryPartner.model.js';
import { DeliveryBonusTransaction } from '../../admin/models/deliveryBonusTransaction.model.js';
import { getDeliveryCashLimitSettings } from '../../admin/services/admin.service.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { getRiderBalances } from '../../../../core/payments/payoutBalances.service.js';
import { PaymentIntent } from '../../../../core/payments/models/paymentIntent.model.js';
import { withPayoutLock } from '../../../../core/payments/payoutLock.js';
import { sessionOpts } from '../../../../utils/dbTransaction.js';
import { round2, gtMoney, ltMoney, isPositiveMoney } from '../../../../utils/money.js';
import { createCashfreeOrder, fetchCashfreeOrder, isCashfreeConfigured } from '../../orders/helpers/cashfree.helper.js';

/**
 * Enhanced wallet fetch for delivery partners.
 * Integrates:
 * 1. Historical orders (earnings)
 * 2. Admin bonuses
 * 3. Withdrawals (pending/payout)
 * 4. Cash collected vs limit
 */
export const getDeliveryPartnerWalletEnhanced = async (deliveryPartnerId) => {
    if (!deliveryPartnerId || !mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
        throw new ValidationError('Invalid delivery partner ID');
    }

    const partnerId = new mongoose.Types.ObjectId(deliveryPartnerId);
    const partner = await FoodDeliveryPartner.findById(partnerId).lean();
    if (!partner) throw new ValidationError('Delivery partner not found');

    const [cashLimitSettings, balances, withdrawalsList, depositList] = await Promise.all([
        getDeliveryCashLimitSettings(),
        getRiderBalances(partnerId),
        FoodDeliveryWithdrawal.find({ deliveryPartnerId: partnerId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
        FoodDeliveryCashDeposit.find({ deliveryPartnerId: partnerId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
    ]);

    const { totalEarned, totalBonus, totalWithdrawn, pendingWithdrawals, cashInHand, pocketBalance } = balances;
    const totalCashLimit = Number(cashLimitSettings.deliveryCashLimit) || 0;
    const deliveryWithdrawalLimit = Number(cashLimitSettings.deliveryWithdrawalLimit) || 100;

    // Fetch transactions for UI (Orders, Bonuses, Withdrawals)
    const [ordersTx] = await Promise.all([
        FoodOrder.find({ 'dispatch.deliveryPartnerId': partnerId, orderStatus: 'delivered' })
            .sort({ createdAt: -1 })
            .select('orderId riderEarning payment orderStatus createdAt')
            .limit(20)
            .lean(),
    ]);

    const transactions = [
        ...(ordersTx || []).map(o => ({
            id: o._id,
            type: 'payment',
            amount: o.riderEarning || 0,
            status: 'Completed',
            date: o.createdAt,
            description: o.payment?.method === 'cash' ? 'COD delivery earning' : 'Online delivery earning',
            orderId: o.orderId
        })),
        ...(withdrawalsList || []).map(w => ({
            id: w._id,
            type: 'withdrawal',
            amount: w.amount,
            status: w.status === 'pending' ? 'Pending' : (w.status === 'approved' ? 'Completed' : 'Rejected'),
            date: w.createdAt,
            description: `Withdrawal Request - ${w.paymentMethod}`,
            payoutMethod: w.paymentMethod
        })),
        ...(depositList || []).map(d => ({
            id: d._id,
            type: 'deposit',
            amount: d.amount,
            status: d.status || 'Pending',
            date: d.createdAt,
            description: 'Cash limit settlement',
            paymentMethod: d.paymentMethod || 'cash',
            razorpayPaymentId: d.razorpayPaymentId || '',
            razorpayOrderId: d.razorpayOrderId || ''
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
        totalBalance: totalEarned + totalBonus, // Gross lifetime earnings
        pocketBalance, // Available to withdraw
        cashInHand, // COD to be deposited/deducted
        totalWithdrawn, // Actually paid out
        pendingWithdrawals, // In process
        totalEarned,
        totalBonus,
        totalCashLimit,
        // Available cash limit is simply the total cash limit minus the cash currently in hand.
        availableCashLimit: Math.max(0, totalCashLimit - cashInHand),
        deliveryWithdrawalLimit,
        transactions: transactions.slice(0, 50)
    };
};

/**
 * Submits a new withdrawal request for a delivery partner.
 */
export const requestDeliveryWithdrawal = async (deliveryPartnerId, payload) => {
    const { bankDetails, paymentMethod = 'bank_transfer', idempotencyKey } = payload;
    const amount = round2(payload.amount);

    if (!isPositiveMoney(amount) || amount < 1) throw new ValidationError('Invalid amount');

    const partner = await FoodDeliveryPartner.findById(deliveryPartnerId).lean();
    if (!partner) throw new ValidationError('Delivery partner not found');

    const key = idempotencyKey ? String(idempotencyKey).slice(0, 100) : undefined;
    if (key) {
        const existing = await FoodDeliveryWithdrawal.findOne({ deliveryPartnerId, idempotencyKey: key }).lean();
        if (existing) return existing;
    }

    const settings = await getDeliveryCashLimitSettings();
    const minimum = Number(settings.deliveryWithdrawalLimit) || 100;

    try {
        // The balance check and the insert happen under the rider's payout lock, so two
        // simultaneous requests can never both pass the check and over-withdraw.
        return await withPayoutLock('deliveryBoy', deliveryPartnerId, async (session) => {
            const balances = await getRiderBalances(deliveryPartnerId);
            if (ltMoney(amount, minimum)) {
                throw new ValidationError(`Minimum withdrawal amount is ₹${minimum}`);
            }
            if (gtMoney(amount, balances.availableToWithdraw)) {
                throw new ValidationError(`Insufficient balance. You already have ₹${balances.pendingWithdrawals} in pending requests.`);
            }

            const [created] = await FoodDeliveryWithdrawal.create([{
                deliveryPartnerId,
                amount,
                paymentMethod,
                bankDetails: bankDetails || {
                    accountNumber: partner.bankAccountNumber,
                    ifscCode: partner.bankIfscCode,
                    bankName: partner.bankName,
                    accountHolderName: partner.bankAccountHolderName
                },
                upiId: partner.upiId,
                upiQrCode: partner.upiQrCode,
                status: 'pending',
                idempotencyKey: key
            }], sessionOpts(session));
            return created;
        });
    } catch (err) {
        if (err?.code === 11000 && key) {
            const existing = await FoodDeliveryWithdrawal.findOne({ deliveryPartnerId, idempotencyKey: key }).lean();
            if (existing) return existing;
        }
        throw err;
    }
};

export const createDeliveryCashDepositOrder = async (deliveryPartnerId, amountInr) => {
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount < 1) {
        throw new ValidationError('Amount must be at least ₹1');
    }
    if (amount > 500000) {
        throw new ValidationError('Maximum deposit is ₹5,00,000');
    }

    const wallet = await getDeliveryPartnerWalletEnhanced(deliveryPartnerId);
    if (amount > wallet.cashInHand) {
        throw new ValidationError('Deposit amount cannot exceed cash in hand');
    }

    const orderId = `cash_deposit_${String(deliveryPartnerId).slice(-8)}_${Date.now()}`;

    if (!isCashfreeConfigured()) {
        return {
            payment_session_id: `session_mock_${Date.now()}`,
            order_id: orderId,
            cashfree: {
                payment_session_id: `session_mock_${Date.now()}`,
                order_id: orderId,
                order_amount: amount,
                order_currency: 'INR'
            },
            razorpay: {
                orderId,
                amount: Math.round(amount * 100),
                currency: 'INR'
            }
        };
    }

    const cfOrder = await createCashfreeOrder({
        orderId,
        amount,
        currency: 'INR',
        customerPhone: '9999999999',
        customerName: 'Delivery Partner',
        note: `Cash deposit for partner ${deliveryPartnerId}`
    });

    await PaymentIntent.create({
        kind: 'rider_cash_deposit',
        ownerId: new mongoose.Types.ObjectId(String(deliveryPartnerId)),
        gatewayOrderId: orderId,
        paymentSessionId: cfOrder?.payment_session_id || '',
        amount: amount,
        amountPaise: Math.round(amount * 100)
    });

    return {
        payment_session_id: cfOrder?.payment_session_id,
        order_id: orderId,
        cashfree: {
            payment_session_id: cfOrder?.payment_session_id,
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR'
        },
        razorpay: {
            orderId,
            amount: Math.round(amount * 100),
            currency: 'INR'
        }
    };
};

/**
 * Record a rider's cash deposit that the payment gateway has captured. Shared by the verify endpoint and the
 * webhook.
 */
export const recordRiderCashDeposit = async ({ deliveryPartnerId, amount, orderId, paymentId, method = 'cashfree', enforceCashLimit = true, via = 'verify_api' }) => {
    const markIntent = () =>
        PaymentIntent.updateOne(
            { gatewayOrderId: orderId, status: 'created' },
            { $set: { status: 'completed', gatewayPaymentId: paymentId, completedAt: new Date(), completedVia: via } }
        );

    try {
        const deposit = await withPayoutLock('deliveryBoy', deliveryPartnerId, async (session) => {
            if (enforceCashLimit) {
                const { cashInHand } = await getRiderBalances(deliveryPartnerId);
                if (gtMoney(amount, cashInHand)) {
                    throw new ValidationError('Deposit amount cannot exceed cash in hand');
                }
            }
            const [created] = await FoodDeliveryCashDeposit.create([{
                deliveryPartnerId,
                amount,
                paymentMethod: method,
                status: 'Completed',
                gatewayOrderId: orderId,
                gatewayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId
            }], sessionOpts(session));
            return created.toObject();
        });
        await markIntent();
        return { deposit, created: true };
    } catch (err) {
        if (err?.code === 11000) {
            const existing = await FoodDeliveryCashDeposit.findOne({
                $or: [{ gatewayPaymentId: paymentId }, { razorpayPaymentId: paymentId }]
            }).lean();
            if (existing) {
                await markIntent();
                return { deposit: existing, created: false };
            }
        }
        throw err;
    }
};

export const verifyDeliveryCashDepositPayment = async (deliveryPartnerId, payload = {}) => {
    const orderId = String(payload?.gatewayOrderId || payload?.orderId || payload?.razorpayOrderId || '').trim();
    let paymentId = String(payload?.gatewayPaymentId || payload?.paymentId || payload?.razorpayPaymentId || orderId).trim();
    let amount = Number(payload?.amount);

    if (!orderId) throw new ValidationError('orderId is required');

    const walletOf = async () => getDeliveryPartnerWalletEnhanced(deliveryPartnerId);

    // This gateway payment may already be recorded (retry / double submit / webhook got there first)
    const already = await FoodDeliveryCashDeposit.findOne({
        $or: [{ gatewayPaymentId: paymentId }, { razorpayPaymentId: paymentId }]
    }).lean();
    if (already) {
        if (String(already.deliveryPartnerId) !== String(deliveryPartnerId)) {
            throw new ValidationError('This payment belongs to another account');
        }
        return { deposit: already, wallet: await walletOf() };
    }

    const configured = isCashfreeConfigured();
    if (configured) {
        let gatewayOrder;
        try {
            gatewayOrder = await fetchCashfreeOrder(orderId);
        } catch {
            throw new ValidationError('Could not verify the payment with the gateway. Please try again.');
        }

        const status = String(gatewayOrder?.order_status || '').toUpperCase();
        if (status !== 'PAID') {
            throw new ValidationError(`Payment is not paid yet (status: ${status || 'PENDING'}). Please try again.`);
        }

        // Only deposit orders WE created for THIS rider can be recorded
        const intent = await PaymentIntent.findOne({ gatewayOrderId: orderId, kind: 'rider_cash_deposit' }).lean();
        if (!intent || String(intent.ownerId) !== String(deliveryPartnerId)) {
            throw new ValidationError('Unknown deposit order');
        }
        amount = Number(gatewayOrder.order_amount);
        paymentId = String(gatewayOrder.cf_order_id || paymentId);
    } else {
        if (!Number.isFinite(amount) || amount < 1) throw new ValidationError('amount is required');
    }

    const { deposit } = await recordRiderCashDeposit({
        deliveryPartnerId,
        amount: round2(amount),
        orderId,
        paymentId,
        method: configured ? 'cashfree' : 'cash',
        enforceCashLimit: true,
        via: 'verify_api'
    });

    return { deposit, wallet: await walletOf() };
};
