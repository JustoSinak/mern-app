"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const models_1 = require("@/models");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
class PaymentService {
    static initialize() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is required');
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2023-10-16'
        });
        logger_1.logger.info('Stripe payment service initialized');
    }
    static async createPaymentIntent(orderId, amount, currency = 'usd', metadata) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency,
                metadata: {
                    orderId,
                    ...metadata
                },
                automatic_payment_methods: {
                    enabled: true
                }
            });
            await models_1.Order.findByIdAndUpdate(orderId, {
                'paymentDetails.paymentIntentId': paymentIntent.id,
                'paymentDetails.transactionId': paymentIntent.id
            });
            logger_1.logger.info(`Payment intent created: ${paymentIntent.id} for order ${orderId}`);
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating payment intent:', error);
            throw new errorHandler_1.AppError('Failed to create payment intent', 500);
        }
    }
    static async confirmPayment(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status === 'succeeded') {
                const orderId = paymentIntent.metadata.orderId;
                if (orderId) {
                    await models_1.Order.findByIdAndUpdate(orderId, {
                        'paymentDetails.status': 'completed',
                        'paymentDetails.paidAt': new Date(),
                        status: 'confirmed'
                    });
                    const order = await models_1.Order.findById(orderId);
                    if (order) {
                        order.addTrackingUpdate('confirmed', 'Payment confirmed, order is being processed');
                        await order.save();
                    }
                    logger_1.logger.info(`Payment confirmed for order ${orderId}`);
                }
                return { success: true, paymentIntent };
            }
            else {
                throw new errorHandler_1.AppError('Payment not successful', 400);
            }
        }
        catch (error) {
            logger_1.logger.error('Error confirming payment:', error);
            throw error;
        }
    }
    static async processRefund(paymentIntentId, amount, reason) {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
                reason: reason || 'requested_by_customer'
            };
            if (amount) {
                refundData.amount = Math.round(amount * 100);
            }
            const refund = await this.stripe.refunds.create(refundData);
            logger_1.logger.info(`Refund processed: ${refund.id} for payment ${paymentIntentId}`);
            return refund;
        }
        catch (error) {
            logger_1.logger.error('Error processing refund:', error);
            throw new errorHandler_1.AppError('Failed to process refund', 500);
        }
    }
    static async handleWebhook(payload, signature) {
        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!webhookSecret) {
                throw new Error('STRIPE_WEBHOOK_SECRET is required');
            }
            const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            logger_1.logger.info(`Stripe webhook received: ${event.type}`);
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'charge.dispute.created':
                    await this.handleChargeDispute(event.data.object);
                    break;
                default:
                    logger_1.logger.info(`Unhandled webhook event type: ${event.type}`);
            }
            return { received: true };
        }
        catch (error) {
            logger_1.logger.error('Error handling webhook:', error);
            throw error;
        }
    }
    static async handlePaymentSucceeded(paymentIntent) {
        try {
            const orderId = paymentIntent.metadata.orderId;
            if (!orderId)
                return;
            const order = await models_1.Order.findById(orderId);
            if (!order)
                return;
            order.paymentDetails.status = 'completed';
            order.paymentDetails.paidAt = new Date();
            order.status = 'confirmed';
            order.addTrackingUpdate('confirmed', 'Payment confirmed successfully');
            await order.save();
            logger_1.logger.info(`Payment succeeded for order ${orderId}`);
        }
        catch (error) {
            logger_1.logger.error('Error handling payment success:', error);
        }
    }
    static async handlePaymentFailed(paymentIntent) {
        try {
            const orderId = paymentIntent.metadata.orderId;
            if (!orderId)
                return;
            const order = await models_1.Order.findById(orderId);
            if (!order)
                return;
            order.paymentDetails.status = 'failed';
            order.status = 'cancelled';
            order.addTrackingUpdate('cancelled', 'Payment failed - order cancelled');
            await order.save();
            for (const item of order.items) {
                await models_1.Order.findByIdAndUpdate(item.productId, {
                    $inc: { inventory: item.quantity }
                });
            }
            logger_1.logger.info(`Payment failed for order ${orderId}`);
        }
        catch (error) {
            logger_1.logger.error('Error handling payment failure:', error);
        }
    }
    static async handleChargeDispute(dispute) {
        try {
            const chargeId = dispute.charge;
            const charge = await this.stripe.charges.retrieve(chargeId);
            const paymentIntentId = charge.payment_intent;
            if (paymentIntentId) {
                const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
                const orderId = paymentIntent.metadata.orderId;
                if (orderId) {
                    const order = await models_1.Order.findById(orderId);
                    if (order) {
                        order.addTrackingUpdate('cancelled', `Payment disputed: ${dispute.reason}`);
                        await order.save();
                    }
                }
            }
            logger_1.logger.warn(`Charge dispute created: ${dispute.id}`);
        }
        catch (error) {
            logger_1.logger.error('Error handling charge dispute:', error);
        }
    }
    static async getPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card'
            });
            return paymentMethods.data;
        }
        catch (error) {
            logger_1.logger.error('Error getting payment methods:', error);
            throw new errorHandler_1.AppError('Failed to get payment methods', 500);
        }
    }
    static async createCustomer(email, name) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name
            });
            logger_1.logger.info(`Stripe customer created: ${customer.id}`);
            return customer;
        }
        catch (error) {
            logger_1.logger.error('Error creating customer:', error);
            throw new errorHandler_1.AppError('Failed to create customer', 500);
        }
    }
    static async getPaymentIntentStatus(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            return {
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting payment intent status:', error);
            throw new errorHandler_1.AppError('Failed to get payment status', 500);
        }
    }
}
exports.PaymentService = PaymentService;
PaymentService.initialize();
//# sourceMappingURL=paymentService.js.map