"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const paymentService_1 = require("@/services/paymentService");
const orderService_1 = require("@/services/orderService");
const logger_1 = require("@/utils/logger");
exports.paymentController = {
    createPaymentIntent: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { orderId, amount, currency = 'usd' } = req.body;
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const order = await orderService_1.OrderService.getOrder(orderId, userId);
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found'
            });
            return;
        }
        const result = await paymentService_1.PaymentService.createPaymentIntent(orderId, amount || order.totalAmount, currency, {
            userId,
            userEmail: req.user?.email || ''
        });
        res.json({
            success: true,
            data: result
        });
    }),
    confirmPayment: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { paymentIntentId } = req.body;
        const result = await paymentService_1.PaymentService.confirmPayment(paymentIntentId);
        res.json({
            success: true,
            message: 'Payment confirmed successfully',
            data: result
        });
    }),
    processRefund: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { paymentIntentId, amount, reason } = req.body;
        const refund = await paymentService_1.PaymentService.processRefund(paymentIntentId, amount, reason);
        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: refund
        });
    }),
    getPaymentStatus: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { paymentIntentId } = req.params;
        if (!paymentIntentId) {
            res.status(400).json({
                success: false,
                message: 'Payment intent ID is required'
            });
            return;
        }
        const status = await paymentService_1.PaymentService.getPaymentIntentStatus(paymentIntentId);
        res.json({
            success: true,
            data: status
        });
    }),
    getPaymentMethods: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const user = req.user;
        res.json({
            success: true,
            data: []
        });
    }),
    handleWebhook: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const signature = req.headers['stripe-signature'];
        const payload = req.body;
        if (!signature) {
            res.status(400).json({
                success: false,
                message: 'Missing stripe signature'
            });
            return;
        }
        try {
            await paymentService_1.PaymentService.handleWebhook(payload, signature);
            res.json({
                success: true,
                message: 'Webhook processed successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Webhook processing failed:', error);
            res.status(400).json({
                success: false,
                message: 'Webhook processing failed'
            });
        }
    }),
    createSetupIntent: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        res.status(501).json({
            success: false,
            message: 'Setup intent creation not implemented yet'
        });
    })
};
//# sourceMappingURL=paymentController.js.map