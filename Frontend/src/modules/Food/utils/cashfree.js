/**
 * Cashfree Payment Gateway Integration Utility
 * Uses @cashfreepayments/cashfree-js
 */
import { load } from '@cashfreepayments/cashfree-js';

let cashfreeInstance = null;
let currentMode = null;

/**
 * Load and get Cashfree instance
 * @param {'sandbox'|'production'} mode 
 */
export const getCashfreeInstance = async (mode = 'sandbox') => {
  const selectedMode = mode === 'production' ? 'production' : 'sandbox';
  if (!cashfreeInstance || currentMode !== selectedMode) {
    cashfreeInstance = await load({ mode: selectedMode });
    currentMode = selectedMode;
  }
  return cashfreeInstance;
};

/**
 * Initialize Cashfree Checkout
 * Calls load({ mode: "sandbox" }) then cashfree.checkout({ paymentSessionId, redirectTarget: "_self" })
 *
 * @param {Object} options
 * @param {string} options.paymentSessionId - Cashfree payment_session_id from order creation
 * @param {string} [options.orderId] - Order ID for reference
 * @param {'sandbox'|'production'} [options.mode='sandbox'] - Gateway environment
 * @param {'_modal'|'_self'|'_blank'} [options.redirectTarget='_self'] - Checkout presentation
 * @param {Function} [options.handler] - Callback on payment completion
 * @param {Function} [options.onCompleted] - Alternative callback on payment completion
 * @param {Function} [options.onError] - Callback on error
 * @param {Function} [options.onClose] - Callback when modal dismissed
 */
export const initCashfreePayment = async (options = {}) => {
  const {
    paymentSessionId,
    orderId,
    mode = 'sandbox',
    redirectTarget = '_self',
    handler,
    onCompleted,
    onError,
    onClose
  } = options;

  if (!paymentSessionId) {
    const err = new Error('paymentSessionId is required to start Cashfree checkout');
    if (onError) onError(err);
    throw err;
  }

  try {
    const cashfree = await getCashfreeInstance(mode);

    console.log('[Cashfree] Starting checkout:', {
      mode,
      redirectTarget,
      paymentSessionId: paymentSessionId.substring(0, 15) + '...',
      orderId
    });

    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: redirectTarget || '_self'
    });

    if (result?.error) {
      console.warn('[Cashfree] Checkout error/cancelled:', result.error);
      if (result.error.code === 'USER_DROPPED' || result.error.message?.includes('closed')) {
        if (onClose) onClose();
      } else {
        if (onError) onError(result.error);
      }
      return result;
    }

    const payload = {
      orderId,
      gatewayOrderId: orderId,
      paymentSessionId,
      paymentDetails: result?.paymentDetails,
      success: true,
      razorpay_order_id: orderId,
      razorpay_payment_id: result?.paymentDetails?.paymentMessage || orderId,
      razorpay_signature: 'cashfree_verified'
    };

    if (handler) handler(payload);
    if (onCompleted) onCompleted(payload);

    return payload;
  } catch (error) {
    console.error('[Cashfree] Error during checkout:', error);
    if (onError) onError(error);
    throw error;
  }
};
