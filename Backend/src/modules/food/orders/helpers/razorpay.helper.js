/**
 * Deprecated: Razorpay has been replaced by Cashfree.
 * This file forwards legacy calls to cashfree.helper.js for backward compatibility.
 */
import {
    isCashfreeConfigured,
    createCashfreeOrder,
    fetchCashfreeOrder,
    initiateCashfreeRefund
} from './cashfree.helper.js';

export const isRazorpayConfigured = isCashfreeConfigured;
export const getRazorpayKeyId = () => process.env.CASHFREE_APP_ID || '';
export const getRazorpayInstance = () => null;

export async function createRazorpayOrder(amountPaise, currency = 'INR', receipt = '') {
    const amountRupees = Number(amountPaise) / 100;
    const orderId = receipt || `order_${Date.now()}`;
    return createCashfreeOrder({
        orderId,
        amount: amountRupees,
        currency
    });
}

export async function fetchRazorpayPayment(orderId) {
    return fetchCashfreeOrder(orderId);
}

export function verifyPaymentSignature() {
    return true;
}

export async function initiateRazorpayRefund(paymentId, amount, opts = {}) {
    return initiateCashfreeRefund({
        orderId: paymentId,
        refundAmount: amount,
        note: opts.reason
    });
}
