import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { PaymentService } from '../services/paymentService';
import { OrderService } from '../services/orderService';
import { AuthenticatedRequest } from '../types/common';
import { logger } from '../utils/logger';

export const paymentController = {
  /**
   * Create payment intent
   * @route POST /api/payments/create-intent
   * @access Private
   */
  createPaymentIntent: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { orderId, amount, currency = 'usd' } = req.body;
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Verify order belongs to user
    const order = await OrderService.getOrder(orderId, userId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    const result = await PaymentService.createPaymentIntent(
      orderId,
      amount || order.totalAmount,
      currency,
      {
        userId,
        userEmail: req.user?.email || ''
      }
    );

    res.json({
      success: true,
      data: result
    });
  }),

  /**
   * Confirm payment
   * @route POST /api/payments/confirm
   * @access Private
   */
  confirmPayment: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { paymentIntentId } = req.body;

    const result = await PaymentService.confirmPayment(paymentIntentId);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: result
    });
  }),

  /**
   * Process refund
   * @route POST /api/payments/refund
   * @access Private/Admin
   */
  processRefund: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { paymentIntentId, amount, reason } = req.body;

    const refund = await PaymentService.processRefund(paymentIntentId, amount, reason);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: refund
    });
  }),

  /**
   * Get payment status
   * @route GET /api/payments/status/:paymentIntentId
   * @access Private
   */
  getPaymentStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
      return;
    }

    const status = await PaymentService.getPaymentIntentStatus(paymentIntentId);

    res.json({
      success: true,
      data: status
    });
  }),

  /**
   * Get user payment methods
   * @route GET /api/payments/methods
   * @access Private
   */
  getPaymentMethods: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    // For now, return empty array since stripeCustomerId is not in the User model yet
    // TODO: Add stripeCustomerId to User model
    res.json({
      success: true,
      data: []
    });
  }),

  /**
   * Handle Stripe webhooks
   * @route POST /api/payments/webhook
   * @access Public
   */
  handleWebhook: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    if (!signature) {
      res.status(400).json({
        success: false,
        message: 'Missing stripe signature'
      });
      return;
    }

    try {
      await PaymentService.handleWebhook(payload, signature);

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }),

  /**
   * Create setup intent for saving payment method
   * @route POST /api/payments/setup-intent
   * @access Private
   */
  createSetupIntent: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // TODO: Create Stripe customer if doesn't exist
    // This would require updating the User model to include stripeCustomerId
    // For now, we'll skip this step

    // TODO: Implement setup intent creation
    res.status(501).json({
      success: false,
      message: 'Setup intent creation not implemented yet'
    });
  })
};
