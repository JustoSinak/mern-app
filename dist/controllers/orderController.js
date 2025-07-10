"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const orderService_1 = require("@/services/orderService");
exports.orderController = {
    createOrder: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const orderData = req.body;
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const order = await orderService_1.OrderService.createOrder(orderData, userId);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    }),
    getUserOrders: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userId = req.user?._id?.toString();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const result = await orderService_1.OrderService.getUserOrders(userId, page, limit);
        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    }),
    getAllOrders: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const result = await orderService_1.OrderService.getAllOrders(page, limit, status);
        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    }),
    getOrder: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        const userId = req.user?._id?.toString();
        const isAdmin = req.user?.role === 'admin';
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }
        const order = await orderService_1.OrderService.getOrder(id, isAdmin ? undefined : userId);
        res.json({
            success: true,
            data: order
        });
    }),
    updateOrderStatus: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        const { status, message, trackingNumber, location } = req.body;
        const adminUserId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }
        const order = await orderService_1.OrderService.updateOrderStatus(id, status, message, trackingNumber, location, adminUserId);
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    }),
    cancelOrder: (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const order = await orderService_1.OrderService.cancelOrder(id, userId, reason);
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    }),
    processRefund: (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { amount, reason } = req.body;
        const adminUserId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }
        if (!adminUserId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const order = await orderService_1.OrderService.processRefund(id, amount, reason, adminUserId);
        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: order
        });
    }),
    getOrderTracking: (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user?._id?.toString();
        const isAdmin = req.user?.role === 'admin';
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }
        const tracking = await orderService_1.OrderService.getOrderTracking(id, isAdmin ? undefined : userId);
        res.json({
            success: true,
            data: tracking
        });
    }),
    requestReturn: (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { reason, items } = req.body;
        const userId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const order = await orderService_1.OrderService.requestReturn(id, userId, reason, items);
        res.json({
            success: true,
            message: 'Return request submitted successfully',
            data: order
        });
    })
};
//# sourceMappingURL=orderController.js.map