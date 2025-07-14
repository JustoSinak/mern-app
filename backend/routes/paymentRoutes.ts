import express from 'express';
import { paymentController } from '../controllers/paymentController';
import { auth, adminAuth } from '../middleware/auth';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// @route   POST /api/payments/create-intent
// @desc    Create payment intent
// @access  Private
router.post('/create-intent', 
  auth,
  [
    body('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency').optional().isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
    handleValidationErrors
  ],
  paymentController.createPaymentIntent
);

// @route   POST /api/payments/confirm
// @desc    Confirm payment
// @access  Private
router.post('/confirm',
  auth,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    handleValidationErrors
  ],
  paymentController.confirmPayment
);

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private/Admin
router.post('/refund',
  auth,
  adminAuth,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    handleValidationErrors
  ],
  paymentController.processRefund
);

// @route   GET /api/payments/status/:paymentIntentId
// @desc    Get payment status
// @access  Private
router.get('/status/:paymentIntentId',
  auth,
  [
    param('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    handleValidationErrors
  ],
  paymentController.getPaymentStatus
);

// @route   GET /api/payments/methods
// @desc    Get user payment methods
// @access  Private
router.get('/methods', auth, paymentController.getPaymentMethods);

// @route   POST /api/payments/setup-intent
// @desc    Create setup intent for saving payment method
// @access  Private
router.post('/setup-intent', auth, paymentController.createSetupIntent);

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', 
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

export default router;
