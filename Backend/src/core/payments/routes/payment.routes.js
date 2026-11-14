import express from 'express';
import { createCashfreeOrder, fetchCashfreeOrder, isCashfreeConfigured } from '../../../modules/food/orders/helpers/cashfree.helper.js';
import { handleCashfreeWebhook } from '../controllers/cashfreeWebhook.controller.js';
import { ValidationError } from '../../auth/errors.js';
import { sendResponse } from '../../../utils/response.js';

const router = express.Router();

/**
 * Cashfree Webhook endpoint: /api/v1/payments/webhook, /api/v1/payments/webhook/cashfree
 */
router.post('/webhook', handleCashfreeWebhook);
router.post('/webhook/cashfree', handleCashfreeWebhook);
router.post('/webhook/razorpay', handleCashfreeWebhook);

/**
 * Dedicated Cashfree Order Creation Endpoint
 * Calls PGCreateOrder and returns payment_session_id and order_id
 * Amounts are in RUPEES directly (no paise conversion)
 */
router.post('/cashfree/create-order', async (req, res, next) => {
    try {
        const { orderId, amount, customerPhone, customerName, customerEmail, note, returnUrl, notifyUrl } = req.body || {};
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            throw new ValidationError('A valid amount in rupees is required');
        }

        const generatedOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        if (!isCashfreeConfigured()) {
            return sendResponse(res, 200, 'Order created (dev mode)', {
                payment_session_id: `session_dev_${Date.now()}`,
                order_id: generatedOrderId,
                amount: parsedAmount,
                currency: 'INR'
            });
        }

        const response = await createCashfreeOrder({
            orderId: generatedOrderId,
            amount: parsedAmount,
            customerPhone: customerPhone || '9999999999',
            customerName: customerName || 'Customer',
            customerEmail: customerEmail || 'customer@example.com',
            note: note || 'Order payment',
            returnUrl,
            notifyUrl
        });

        return sendResponse(res, 200, 'Order created successfully', {
            payment_session_id: response.payment_session_id,
            order_id: response.order_id || generatedOrderId,
            cf_order_id: response.cf_order_id,
            order_status: response.order_status,
            amount: parsedAmount,
            currency: 'INR'
        });
    } catch (error) {
        next(error);
    }
});

// Alias for generic /create-order
router.post('/create-order', (req, res, next) => {
    req.url = '/cashfree/create-order';
    router.handle(req, res, next);
});

/**
 * Dedicated Cashfree Order Verification Endpoint
 * Fetches order via PGFetchOrder and treats PAID as success. Never trusts client.
 */
router.post('/cashfree/verify', async (req, res, next) => {
    try {
        const orderId = req.body?.orderId || req.body?.order_id || req.body?.gatewayOrderId;
        if (!orderId) {
            throw new ValidationError('order_id is required for verification');
        }

        if (!isCashfreeConfigured()) {
            return sendResponse(res, 200, 'Order verified (dev mode)', {
                order_id: orderId,
                order_status: 'PAID',
                paid: true
            });
        }

        const orderData = await fetchCashfreeOrder(orderId);
        const orderStatus = String(orderData?.order_status || '').toUpperCase();
        const isPaid = orderStatus === 'PAID';

        return sendResponse(res, 200, isPaid ? 'Payment successful' : 'Payment pending or incomplete', {
            order_id: orderData.order_id || orderId,
            order_status: orderStatus,
            order_amount: orderData.order_amount,
            paid: isPaid,
            cf_order_id: orderData.cf_order_id
        });
    } catch (error) {
        next(error);
    }
});

router.post('/verify-order', (req, res, next) => {
    req.url = '/cashfree/verify';
    router.handle(req, res, next);
});

export default router;

