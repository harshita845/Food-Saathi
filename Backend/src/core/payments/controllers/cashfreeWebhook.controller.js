import mongoose from 'mongoose';
import { FoodOrder } from '../../../modules/food/orders/models/order.model.js';
import { FoodTransaction } from '../../../modules/food/orders/models/foodTransaction.model.js';
import * as financeService from '../../../modules/food/orders/services/finance.service.js';
import { afterOnlinePaymentCaptured } from '../../../modules/food/orders/services/order.service.js';
import { creditTopupIntent } from '../../../modules/food/user/services/userWallet.service.js';
import { recordRiderCashDeposit } from '../../../modules/food/delivery/services/deliveryFinance.service.js';
import { PaymentIntent } from '../models/paymentIntent.model.js';
import { PaymentWebhookEvent } from '../models/webhookEvent.model.js';
import { verifyCashfreeWebhookSignature } from '../../../modules/food/orders/helpers/cashfree.helper.js';
import { logger } from '../../../utils/logger.js';

/** Find transaction by Cashfree order id or gateway order id */
const findTransactionByGatewayOrder = async (orderId) => {
    if (!orderId) return null;
    return FoodTransaction.findOne({
        $or: [
            { 'gateway.gatewayOrderId': String(orderId) },
            { 'gateway.orderId': String(orderId) },
            { 'payment.gateway.orderId': String(orderId) },
            { 'payment.razorpay.orderId': String(orderId) }
        ]
    }).lean();
};

/** Top-up or rider cash deposit */
async function handleIntentCapture({ orderId, paymentId, amount }) {
    if (!orderId) return null;
    const intent = await PaymentIntent.findOne({ gatewayOrderId: String(orderId) }).lean();
    if (!intent) return null;
    if (intent.status === 'completed') return null;

    const amountInr = Number(amount);

    if (intent.kind === 'wallet_topup') {
        await creditTopupIntent(intent, {
            gatewayPaymentId: String(paymentId),
            amountInr,
            amountPaise: Math.round(amountInr * 100),
            source: 'webhook'
        });
        logger.info(`Webhook [Cashfree]: credited wallet top-up ${intent.gatewayOrderId}`);
    } else if (intent.kind === 'rider_cash_deposit') {
        await recordRiderCashDeposit({
            deliveryPartnerId: intent.ownerId,
            amount: amountInr,
            orderId: intent.gatewayOrderId,
            paymentId: String(paymentId),
            method: 'cashfree',
            enforceCashLimit: false,
            via: 'webhook'
        });
        logger.info(`Webhook [Cashfree]: recorded rider cash deposit ${intent.gatewayOrderId}`);
    }
    return null;
}

export async function handleCashfreeWebhook(req, res) {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-cf-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || (req.rawBodyBuffer ? req.rawBodyBuffer.toString('utf-8') : JSON.stringify(req.body));

    if (!verifyCashfreeWebhookSignature({ signature, rawBody, timestamp })) {
        logger.warn('[Cashfree Webhook] Invalid webhook signature');
        return res.status(400).json({ status: 'FAILED', message: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    const eventType = String(payload.type || '').toUpperCase();
    const eventData = payload.data || {};
    const eventRef = String(payload.event_time || Date.now());

    logger.info(`[Cashfree Webhook] Received event: ${eventType}`);

    try {
        if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'PAYMENT_SUCCESS') {
            const orderInfo = eventData.order || {};
            const paymentInfo = eventData.payment || {};
            const gatewayOrderId = String(orderInfo.order_id || '');
            const gatewayPaymentId = String(paymentInfo.cf_payment_id || paymentInfo.payment_id || gatewayOrderId);
            const amount = Number(paymentInfo.payment_amount ?? orderInfo.order_amount ?? 0);

            // Record webhook event for idempotency / audit
            try {
                await PaymentWebhookEvent.create({
                    eventId: `cf_${gatewayPaymentId}_${eventType}`,
                    event: eventType,
                    payload
                });
            } catch (err) {
                if (err?.code === 11000) {
                    return res.status(200).json({ status: 'OK', message: 'Already processed' });
                }
            }

            const transaction = await findTransactionByGatewayOrder(gatewayOrderId);
            if (!transaction) {
                await handleIntentCapture({ orderId: gatewayOrderId, paymentId: gatewayPaymentId, amount });
                return res.status(200).json({ status: 'OK' });
            }

            const result = await financeService.capturePayment(transaction.orderId, {
                method: 'cashfree',
                source: 'webhook',
                actor: { role: 'SYSTEM' },
                gatewayPaymentId,
                gatewayOrderId,
                amountInr: amount,
                amountPaise: Math.round(amount * 100),
                note: 'Captured payment verified through Cashfree webhook',
                ref: eventRef
            });

            if (result.applied) {
                await afterOnlinePaymentCaptured(transaction.orderId);
            }
        } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || eventType === 'PAYMENT_USER_DROPPED_WEBHOOK') {
            const orderInfo = eventData.order || {};
            const gatewayOrderId = String(orderInfo.order_id || '');
            const transaction = await findTransactionByGatewayOrder(gatewayOrderId);
            if (transaction) {
                await financeService.recordPaymentAttemptFailure(transaction.orderId, {
                    gatewayPaymentId: String(eventData.payment?.cf_payment_id || ''),
                    reason: String(eventData.payment?.payment_message || 'Payment attempt failed'),
                    source: 'webhook'
                });
            }
        }

        return res.status(200).json({ status: 'OK' });
    } catch (error) {
        logger.error(`[Cashfree Webhook] Error processing event ${eventType}: ${error.message}`);
        return res.status(500).json({ status: 'ERROR', message: error.message });
    }
}

