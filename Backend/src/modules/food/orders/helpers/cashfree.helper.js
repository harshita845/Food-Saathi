import { Cashfree, CFEnvironment } from 'cashfree-pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../../../config/env.js';
import { logger } from '../../../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../../../..', '.env');

/**
 * Returns Cashfree credentials safely without printing/logging them.
 */
function getCashfreeCredentials() {
    let appId = config.cashfreeAppId || process.env.CASHFREE_APP_ID || '';
    let secretKey = config.cashfreeSecretKey || process.env.CASHFREE_SECRET_KEY || '';

    // If missing from initial start, dynamically reload from Backend/.env
    if (!appId || !secretKey) {
        dotenv.config({ path: backendEnvPath, override: true });
        appId = process.env.CASHFREE_APP_ID || config.cashfreeAppId || '';
        secretKey = process.env.CASHFREE_SECRET_KEY || config.cashfreeSecretKey || '';
        if (appId) config.cashfreeAppId = appId;
        if (secretKey) config.cashfreeSecretKey = secretKey;
        if (process.env.CASHFREE_ENV) config.cashfreeEnv = process.env.CASHFREE_ENV;
    }

    const envStr = (config.cashfreeEnv || process.env.CASHFREE_ENV || 'sandbox').toLowerCase().trim();
    const isProduction = envStr === 'production' || envStr === 'prod';
    const env = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    return { appId, secretKey, env, isProduction, baseUrl };
}

export function isCashfreeConfigured() {
    const { appId, secretKey } = getCashfreeCredentials();
    return Boolean(appId && secretKey);
}

export function getCashfreeInstance() {
    if (!isCashfreeConfigured()) return null;
    const { appId, secretKey, env } = getCashfreeCredentials();
    const cf = new Cashfree(env);
    cf.XClientId = appId;
    cf.XClientSecret = secretKey;
    return cf;
}

/**
 * Create a Cashfree Order (PGCreateOrder / REST POST /orders).
 * Correct base URL for sandbox vs production, x-api-version: 2023-08-01,
 * x-client-id and x-client-secret from env.
 * Amounts are strictly in RUPEES.
 *
 * Payload: order_id, order_amount, order_currency: INR,
 * customer_details: (customer_id, customer_phone, customer_name, customer_email)
 * order_meta: { return_url }
 */
export async function createCashfreeOrder({
    orderId,
    amount,
    currency = 'INR',
    customerId,
    customerPhone,
    customerName,
    customerEmail,
    returnUrl,
    notifyUrl,
    note
}) {
    const { appId, secretKey, baseUrl, isProduction } = getCashfreeCredentials();

    if (!appId || !secretKey) {
        logger.error('[Cashfree] Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY in environment');
        throw new Error('Cashfree payment gateway is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Backend/.env');
    }

    const cleanPhone = String(customerPhone || '').replace(/\D/g, '').slice(-10) || '9999999999';
    const amountInRupees = Number(Number(amount).toFixed(2));
    if (isNaN(amountInRupees) || amountInRupees < 1) {
        throw new Error('Order amount must be at least ₹1.00');
    }

    const custId = String(customerId || cleanPhone || orderId).replace(/[^a-zA-Z0-9_-]/g, '').slice(-40) || `cust_${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const computedReturnUrl = returnUrl || `${frontendUrl}/food/user/orders/{order_id}?cashfree_return=true`;

    const orderRequest = {
        order_id: String(orderId),
        order_amount: amountInRupees,
        order_currency: currency || 'INR',
        customer_details: {
            customer_id: custId,
            customer_phone: cleanPhone,
            customer_name: String(customerName || 'Customer').trim() || 'Customer',
            customer_email: customerEmail || 'customer@foodsaathi.in'
        },
        order_meta: {
            return_url: computedReturnUrl,
            ...(notifyUrl ? { notify_url: notifyUrl } : {})
        },
        ...(note ? { order_note: String(note).slice(0, 200) } : {})
    };

    const url = `${baseUrl}/orders`;
    logger.info(`[Cashfree] Calling Cashfree create order API at ${url} (env: ${isProduction ? 'production' : 'sandbox'}, order_id: ${orderId}, amount: ₹${amountInRupees})`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            },
            body: JSON.stringify(orderRequest)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            logger.error('[Cashfree] PGCreateOrder failed:', {
                status: response.status,
                statusText: response.statusText,
                errorData: data,
                orderId
            });
            const errMsg = data?.message || data?.error || `Cashfree create order failed with status ${response.status}`;
            throw new Error(errMsg);
        }

        logger.info(`[Cashfree] Order created successfully: order_id=${data.order_id}, payment_session_id=${data.payment_session_id ? 'present' : 'missing'}`);

        return {
            order_id: data.order_id || String(orderId),
            payment_session_id: data.payment_session_id,
            order_status: data.order_status,
            order_amount: data.order_amount,
            order_currency: data.order_currency || 'INR',
            raw: data
        };
    } catch (err) {
        logger.error(`[Cashfree] createCashfreeOrder exception for order ${orderId}: ${err.message}`);
        throw err;
    }
}

/**
 * Fetch Order details from Cashfree (PGFetchOrder / GET /orders/:order_id).
 * Server-side verification: treats order_status === 'PAID' as success.
 */
export async function fetchCashfreeOrder(orderId) {
    const { appId, secretKey, baseUrl } = getCashfreeCredentials();

    if (!appId || !secretKey) {
        throw new Error('Cashfree payment gateway is not configured on this server');
    }
    if (!orderId) {
        throw new Error('orderId is required');
    }

    const url = `${baseUrl}/orders/${encodeURIComponent(String(orderId))}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            logger.error(`[Cashfree] PGFetchOrder failed for ${orderId}:`, {
                status: response.status,
                errorData: data
            });
            throw new Error(data?.message || `Cashfree fetch order failed with status ${response.status}`);
        }

        return data;
    } catch (err) {
        logger.error(`[Cashfree] fetchCashfreeOrder exception for ${orderId}: ${err.message}`);
        throw err;
    }
}

/**
 * Verifies Cashfree webhook signature using raw request body.
 * Cashfree computes HMAC-SHA256 over `${timestamp}${rawBody}` using client secret.
 */
export function verifyCashfreeWebhookSignature({ signature, rawBody, timestamp }) {
    const { secretKey } = getCashfreeCredentials();
    if (!secretKey || !signature || !rawBody || !timestamp) {
        return false;
    }

    const payload = `${timestamp}${rawBody}`;
    const generated = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
    try {
        const actualBuffer = Buffer.from(String(signature), 'utf8');
        const expectedBuffer = Buffer.from(generated, 'utf8');
        return actualBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(actualBuffer, expectedBuffer);
    } catch {
        return generated === signature;
    }
}

/**
 * Initiate refund via Cashfree (POST /orders/:order_id/refunds).
 * Amount is in RUPEES.
 */
export async function initiateCashfreeRefund({ orderId, refundAmount, refundId, note = 'Order cancelled' }) {
    const { appId, secretKey, baseUrl } = getCashfreeCredentials();
    if (!appId || !secretKey) {
        throw new Error('Cashfree payment gateway is not configured on this server');
    }

    const refundRequest = {
        refund_amount: Number(Number(refundAmount).toFixed(2)),
        refund_id: refundId || `ref_${orderId}_${Date.now()}`,
        refund_note: note
    };

    const url = `${baseUrl}/orders/${encodeURIComponent(String(orderId))}/refunds`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            },
            body: JSON.stringify(refundRequest)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            logger.error(`[Cashfree] Refund failed for order ${orderId}:`, {
                status: response.status,
                errorData: data
            });
            return {
                success: false,
                error: data?.message || `Refund failed with status ${response.status}`,
                raw: data
            };
        }

        return {
            success: true,
            refundId: data.refund_id || refundRequest.refund_id,
            status: data.refund_status || 'SUCCESS',
            raw: data
        };
    } catch (err) {
        logger.error(`[Cashfree] Refund exception for order ${orderId}: ${err.message}`);
        return {
            success: false,
            error: err.message
        };
    }
}
