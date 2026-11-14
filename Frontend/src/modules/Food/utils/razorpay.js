/**
 * Payment Integration Utility (Migrated to Cashfree)
 * Keeps backward compatibility for any existing callers of initRazorpayPayment.
 */
import { initCashfreePayment } from './cashfree.js';

export { initCashfreePayment };

export const loadRazorpayScript = async () => {
  return Promise.resolve();
};

export const initRazorpayPayment = async (options = {}) => {
  const paymentSessionId = options.paymentSessionId || options.order_id || options.orderId;
  return initCashfreePayment({
    paymentSessionId,
    orderId: options.order_id || options.orderId,
    mode: options.mode || 'sandbox',
    handler: options.handler,
    onError: options.onError,
    onClose: options.onClose
  });
};
