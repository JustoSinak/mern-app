import Stripe from 'stripe';
import { Order } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class PaymentService {
  private static stripe: Stripe;

  /**
   * Initialize Stripe
   */
  static initialize(): void {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any
    });

    logger.info('Stripe payment service initialized');
  }

  /**
   * Create payment intent
   */
  static async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          orderId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Update order with payment intent ID
      await Order.findByIdAndUpdate(orderId, {
        'paymentDetails.paymentIntentId': paymentIntent.id,
        'paymentDetails.transactionId': paymentIntent.id
      });

      logger.info(`Payment intent created: ${paymentIntent.id} for order ${orderId}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new AppError('Failed to create payment intent', 500);
    }
  }

  /**
   * Confirm payment
   */
  static async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update order payment status
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            'paymentDetails.status': 'completed',
            'paymentDetails.paidAt': new Date(),
            status: 'confirmed'
          });

          // Add tracking update
          const order = await Order.findById(orderId);
          if (order) {
            order.addTrackingUpdate('confirmed', 'Payment confirmed, order is being processed');
            await order.save();
          }

          logger.info(`Payment confirmed for order ${orderId}`);
        }

        return { success: true, paymentIntent };
      } else {
        throw new AppError('Payment not successful', 400);
      }
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ) {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer'
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundData);

      logger.info(`Refund processed: ${refund.id} for payment ${paymentIntentId}`);

      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw new AppError('Failed to process refund', 500);
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(
    payload: string | Buffer,
    signature: string
  ) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      if (!orderId) return;

      const order = await Order.findById(orderId);
      if (!order) return;

      // Update payment status
      order.paymentDetails.status = 'completed';
      order.paymentDetails.paidAt = new Date();
      order.status = 'confirmed';

      // Add tracking update
      order.addTrackingUpdate('confirmed', 'Payment confirmed successfully');

      await order.save();

      logger.info(`Payment succeeded for order ${orderId}`);
    } catch (error) {
      logger.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      if (!orderId) return;

      const order = await Order.findById(orderId);
      if (!order) return;

      // Update payment status
      order.paymentDetails.status = 'failed';
      order.status = 'cancelled';

      // Add tracking update
      order.addTrackingUpdate('cancelled', 'Payment failed - order cancelled');

      await order.save();

      // Release inventory
      for (const item of order.items) {
        await Order.findByIdAndUpdate(item.productId, {
          $inc: { inventory: item.quantity }
        });
      }

      logger.info(`Payment failed for order ${orderId}`);
    } catch (error) {
      logger.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle charge dispute
   */
  private static async handleChargeDispute(dispute: Stripe.Dispute) {
    try {
      const chargeId = dispute.charge as string;
      const charge = await this.stripe.charges.retrieve(chargeId);
      const paymentIntentId = charge.payment_intent as string;

      if (paymentIntentId) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            order.addTrackingUpdate('cancelled', `Payment disputed: ${dispute.reason}`);
            await order.save();
          }
        }
      }

      logger.warn(`Charge dispute created: ${dispute.id}`);
    } catch (error) {
      logger.error('Error handling charge dispute:', error);
    }
  }

  /**
   * Get payment methods for customer
   */
  static async getPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Error getting payment methods:', error);
      throw new AppError('Failed to get payment methods', 500);
    }
  }

  /**
   * Create customer
   */
  static async createCustomer(email: string, name: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw new AppError('Failed to create customer', 500);
    }
  }

  /**
   * Get payment intent status
   */
  static async getPaymentIntentStatus(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      logger.error('Error getting payment intent status:', error);
      throw new AppError('Failed to get payment status', 500);
    }
  }
}

// Initialize payment service
PaymentService.initialize();
