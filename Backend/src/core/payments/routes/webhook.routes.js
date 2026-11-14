import express from 'express';
import { handleCashfreeWebhook } from '../controllers/cashfreeWebhook.controller.js';

const router = express.Router();

/**
 * Cashfree Webhook Routes (Public)
 * Paths:
 *   /api/v1/payments/webhook
 *   /api/v1/payments/webhook/cashfree
 *   /api/v1/payments/webhook/razorpay (backward compatibility)
 */
router.post('/', handleCashfreeWebhook);
router.post('/cashfree', handleCashfreeWebhook);
router.post('/razorpay', handleCashfreeWebhook);

export default router;
