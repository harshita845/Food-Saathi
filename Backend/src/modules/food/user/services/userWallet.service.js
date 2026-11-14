import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';
import { creditWallet, debitWallet, getUserWalletForFrontend } from '../../../../core/payments/wallet.service.js';
import { InsufficientBalanceError } from '../../../../core/payments/transaction.service.js';
import { PaymentIntent } from '../../../../core/payments/models/paymentIntent.model.js';
import { fromPaise } from '../../../../utils/money.js';
import {
    createCashfreeOrder,
    fetchCashfreeOrder,
    isCashfreeConfigured
} from '../../orders/helpers/cashfree.helper.js';

/**
 * User wallet operations.
 * The balance lives in payment_user_wallets; every change is a row in the
 * payment_transactions ledger (the single source of truth). Each operation that has a
 * natural unique id (order, referral, gateway order) passes an idempotency key, so a
 * retry or double-click can never move money twice.
 */

const assertUserId = (userId) => {
    const id = String(userId || '');
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('User not found');
    }
    return id;
};

const idOf = (value) => (value ? String(value) : '');

export const getUserWallet = async (userId) => {
    const id = assertUserId(userId);
    return getUserWalletForFrontend(id);
};

export const creditReferralReward = async (userId, amountInr, metadata = {}) => {
    const id = assertUserId(userId);
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { wallet: await getUserWallet(id) };
    }

    const referralLogId = idOf(metadata?.referralLogId);
    await creditWallet({
        entityId: id,
        amount,
        description: 'Referral reward',
        category: 'referral_reward',
        // One reward per user per referral
        idempotencyKey: referralLogId ? `referral_reward:${referralLogId}:${id}` : undefined,
        metadata: metadata || {}
    });
    return { wallet: await getUserWallet(id) };
};

export const createWalletTopupOrder = async (userId, amountInr) => {
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError('Amount must be greater than 0');
    }
    if (amount > 50000) {
        throw new ValidationError('Maximum amount is 50,000');
    }

    const orderId = `wallet_topup_${String(userId).slice(-8)}_${Date.now()}`;

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
        customerName: 'Customer',
        note: `Wallet top-up for user ${userId}`
    });

    await PaymentIntent.create({
        kind: 'wallet_topup',
        ownerId: new mongoose.Types.ObjectId(String(userId)),
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
 * Credit a wallet top-up that gateway has captured. Shared by the verify endpoint and the
 * webhook — whichever arrives first credits, the other is a harmless no-op
 * (ledger key wallet_topup:<gatewayOrderId>).
 */
export const creditTopupIntent = async (intent, { gatewayPaymentId, amountInr, amountPaise, source }) => {
    const creditAmount = Number.isFinite(Number(amountInr)) && Number(amountInr) > 0
        ? Number(amountInr)
        : fromPaise(amountPaise || intent.amountPaise || 0);

    await creditWallet({
        entityId: String(intent.ownerId),
        amount: creditAmount,
        description: 'Wallet top-up',
        category: 'wallet_topup',
        idempotencyKey: `wallet_topup:${intent.gatewayOrderId}`,
        gatewayOrderId: intent.gatewayOrderId,
        gatewayPaymentId,
        metadata: { mode: 'cashfree', via: source, userId: String(intent.ownerId) }
    });
    await PaymentIntent.updateOne(
        { _id: intent._id, status: 'created' },
        { $set: { status: 'completed', gatewayPaymentId, completedAt: new Date(), completedVia: source } }
    );
};

export const verifyWalletTopupPayment = async (userId, payload) => {
    const id = assertUserId(userId);
    const orderId = String(payload?.gatewayOrderId || payload?.orderId || payload?.razorpayOrderId || '').trim();
    let paymentId = String(payload?.gatewayPaymentId || payload?.paymentId || payload?.razorpayPaymentId || orderId).trim();
    let amount = Number(payload?.amount);

    if (!orderId) throw new ValidationError('orderId is required');

    const configured = isCashfreeConfigured();

    if (configured) {
        let gatewayOrder;
        try {
            gatewayOrder = await fetchCashfreeOrder(orderId);
        } catch {
            throw new ValidationError('Could not verify payment with the gateway. Please try again.');
        }

        const status = String(gatewayOrder?.order_status || '').toUpperCase();
        if (status !== 'PAID') {
            throw new ValidationError(`Payment is not paid yet (status: ${status || 'PENDING'}). Please try again.`);
        }

        amount = Number(gatewayOrder.order_amount);
        paymentId = String(gatewayOrder.cf_order_id || paymentId);

        // Only top-up orders WE created for THIS user can be credited
        const intent = await PaymentIntent.findOne({ gatewayOrderId: orderId, kind: 'wallet_topup' }).lean();
        if (!intent || String(intent.ownerId) !== id) {
            throw new ValidationError('Unknown top-up order');
        }
        if (intent.amount && Math.abs(amount - intent.amount) > 0.01) {
            throw new ValidationError('Payment amount does not match the top-up order');
        }

        await creditTopupIntent(intent, {
            gatewayPaymentId: paymentId,
            amountInr: amount,
            amountPaise: Math.round(amount * 100),
            source: 'verify_api'
        });
        return { wallet: await getUserWallet(id) };
    }

    // Dev mode
    if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError('amount is required');
    await creditWallet({
        entityId: id,
        amount,
        description: 'Wallet top-up (dev)',
        category: 'wallet_topup',
        idempotencyKey: `wallet_topup:${orderId}`,
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        metadata: { mode: 'dev', userId: id }
    });

    return { wallet: await getUserWallet(id) };
};

export const deductWalletBalance = async (userId, amountInr, description = 'Order payment', metadata = {}, { session = null } = {}) => {
    const id = assertUserId(userId);
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError('Invalid deduction amount');
    }

    const orderId = idOf(metadata?.orderId);
    try {
        await debitWallet({
                entityId: id,
            amount,
            description,
            category: 'order_payment',
            orderId: orderId || undefined,
            // One wallet payment per order
            idempotencyKey: orderId ? `order_payment:${orderId}` : undefined,
            session,
            metadata: metadata || {}
        });
    } catch (err) {
        if (err instanceof InsufficientBalanceError) {
            throw new ValidationError('Insufficient wallet balance');
        }
        throw err;
    }

    return { wallet: await getUserWallet(id) };
};

export const refundWalletBalance = async (userId, amountInr, description = 'Order refund', metadata = {}, { session = null, idempotencyKey } = {}) => {
    const id = assertUserId(userId);
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { wallet: await getUserWallet(id) };
    }

    const orderId = idOf(metadata?.orderId);
    await creditWallet({
        entityId: id,
        amount,
        description,
        category: 'order_refund',
        orderId: orderId || undefined,
        // One wallet refund per order
        idempotencyKey: idempotencyKey || (orderId ? `order_refund:${orderId}` : undefined),
        session,
        metadata: metadata || {}
    });

    return { wallet: await getUserWallet(id) };
};

export const topupUserWalletByAdmin = async (userId, amountInr, adminId, description = 'Admin Top-up') => {
    const id = assertUserId(userId);
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError('Invalid top-up amount');
    }

    await creditWallet({
        entityId: id,
        amount,
        description,
        category: 'admin_topup',
        metadata: { adminId: idOf(adminId) }
    });

    return { wallet: await getUserWallet(id) };
};
