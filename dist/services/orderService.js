"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const models_1 = require("@/models");
const cartService_1 = require("./cartService");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const mongoose_1 = require("mongoose");
class OrderService {
    static async createOrder(orderData, userId) {
        try {
            const cartValidation = await cartService_1.CartService.validateCartForCheckout(userId);
            const cart = cartValidation.cart;
            const subtotal = cart.subtotal;
            const taxRate = 0.08;
            const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
            const shippingAmount = orderData.shippingMethod.price;
            const discountAmount = 0;
            const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
            const reservations = await cartService_1.CartService.reserveInventory(cart._id.toString());
            try {
                const orderItems = cart.items.map((item) => ({
                    productId: item.productId._id,
                    productName: item.productId.name,
                    productImage: item.productId.images[0]?.url || '',
                    sku: item.productId.sku,
                    variantId: item.variantId,
                    variantName: item.variantId ? `${item.variantId.name}: ${item.variantId.value}` : undefined,
                    quantity: item.quantity,
                    price: item.productId.price,
                    totalPrice: item.productId.price * item.quantity
                }));
                const order = new models_1.Order({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    items: orderItems,
                    subtotal,
                    taxAmount,
                    shippingAmount,
                    discountAmount,
                    totalAmount,
                    shippingAddress: orderData.shippingAddress,
                    billingAddress: orderData.billingAddress,
                    shippingMethod: orderData.shippingMethod,
                    paymentDetails: {
                        method: 'stripe',
                        transactionId: 'pending',
                        status: 'pending',
                        amount: totalAmount,
                        currency: 'USD'
                    },
                    customerNotes: orderData.customerNotes,
                    couponCode: orderData.couponCode
                });
                order.addTrackingUpdate('pending', 'Order created and awaiting payment');
                await order.save();
                await cartService_1.CartService.clearCart(userId);
                logger_1.logger.info(`Order created: ${order.orderNumber} for user ${userId}`);
                return order;
            }
            catch (error) {
                await cartService_1.CartService.releaseInventory(reservations);
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Error creating order:', error);
            throw error;
        }
    }
    static async getUserOrders(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [orders, total] = await Promise.all([
                models_1.Order.find({ userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                models_1.Order.countDocuments({ userId })
            ]);
            return {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user orders:', error);
            throw error;
        }
    }
    static async getAllOrders(page = 1, limit = 20, status) {
        try {
            const skip = (page - 1) * limit;
            const filter = status ? { status } : {};
            const [orders, total] = await Promise.all([
                models_1.Order.find(filter)
                    .populate('userId', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                models_1.Order.countDocuments(filter)
            ]);
            return {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting all orders:', error);
            throw error;
        }
    }
    static async getOrder(orderId, userId) {
        try {
            const filter = { _id: orderId };
            if (userId) {
                filter.userId = userId;
            }
            const order = await models_1.Order.findOne(filter)
                .populate('userId', 'firstName lastName email')
                .lean();
            if (!order) {
                throw new errorHandler_1.AppError('Order not found', 404);
            }
            return order;
        }
        catch (error) {
            logger_1.logger.error('Error getting order:', error);
            throw error;
        }
    }
    static async updateOrderStatus(orderId, status, message, trackingNumber, location, adminUserId) {
        try {
            const order = await models_1.Order.findById(orderId);
            if (!order) {
                throw new errorHandler_1.AppError('Order not found', 404);
            }
            order.addTrackingUpdate(status, message || `Order status updated to ${status}`, location);
            if (trackingNumber) {
                order.trackingNumber = trackingNumber;
            }
            if (status === 'shipped' && order.shippingMethod.estimatedDays) {
                const estimatedDate = new Date();
                estimatedDate.setDate(estimatedDate.getDate() + order.shippingMethod.estimatedDays);
                order.estimatedDeliveryDate = estimatedDate;
            }
            await order.save();
            logger_1.logger.info(`Order ${order.orderNumber} status updated to ${status} by ${adminUserId || 'system'}`);
            return order;
        }
        catch (error) {
            logger_1.logger.error('Error updating order status:', error);
            throw error;
        }
    }
    static async cancelOrder(orderId, userId, reason) {
        try {
            const order = await models_1.Order.findOne({ _id: orderId, userId });
            if (!order) {
                throw new errorHandler_1.AppError('Order not found', 404);
            }
            if (!order.canBeCancelled()) {
                throw new errorHandler_1.AppError('Order cannot be cancelled at this stage', 400);
            }
            for (const item of order.items) {
                await models_1.Product.findByIdAndUpdate(item.productId, { $inc: { inventory: item.quantity } });
            }
            order.addTrackingUpdate('cancelled', reason || 'Order cancelled by customer');
            await order.save();
            logger_1.logger.info(`Order ${order.orderNumber} cancelled by user ${userId}`);
            return order;
        }
        catch (error) {
            logger_1.logger.error('Error cancelling order:', error);
            throw error;
        }
    }
    static async processRefund(orderId, amount, reason, adminUserId) {
        try {
            const order = await models_1.Order.findById(orderId);
            if (!order) {
                throw new errorHandler_1.AppError('Order not found', 404);
            }
            if (order.paymentDetails.status !== 'completed') {
                throw new errorHandler_1.AppError('Cannot refund unpaid order', 400);
            }
            order.paymentDetails.status = amount >= order.totalAmount ? 'refunded' : 'partially_refunded';
            order.paymentDetails.refundedAmount = (order.paymentDetails.refundedAmount || 0) + amount;
            order.paymentDetails.refundedAt = new Date();
            order.addTrackingUpdate('cancelled', `Refund processed: $${amount.toFixed(2)} - ${reason}`);
            await order.save();
            logger_1.logger.info(`Refund processed for order ${order.orderNumber}: $${amount} by ${adminUserId}`);
            return order;
        }
        catch (error) {
            logger_1.logger.error('Error processing refund:', error);
            throw error;
        }
    }
    static async getOrderTracking(orderId, userId) {
        try {
            const order = await this.getOrder(orderId, userId);
            return {
                orderNumber: order.orderNumber,
                status: order.status,
                trackingNumber: order.trackingNumber,
                estimatedDeliveryDate: order.estimatedDeliveryDate,
                actualDeliveryDate: order.actualDeliveryDate,
                orderTracking: order.orderTracking,
                shippingMethod: order.shippingMethod
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting order tracking:', error);
            throw error;
        }
    }
    static async requestReturn(orderId, userId, reason, items) {
        try {
            const order = await models_1.Order.findOne({ _id: orderId, userId });
            if (!order) {
                throw new errorHandler_1.AppError('Order not found', 404);
            }
            if (!order.canBeReturned()) {
                throw new errorHandler_1.AppError('Order cannot be returned', 400);
            }
            order.returnRequested = true;
            order.returnReason = reason;
            order.returnStatus = 'pending';
            order.returnRequestedAt = new Date();
            order.addTrackingUpdate('returned', `Return requested: ${reason}`);
            await order.save();
            logger_1.logger.info(`Return requested for order ${order.orderNumber} by user ${userId}`);
            return order;
        }
        catch (error) {
            logger_1.logger.error('Error requesting return:', error);
            throw error;
        }
    }
    static async getOrderStatistics() {
        try {
            const stats = await models_1.Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ]);
            const totalOrders = await models_1.Order.countDocuments();
            const totalRevenue = await models_1.Order.aggregate([
                { $match: { 'paymentDetails.status': 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]);
            return {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                statusBreakdown: stats
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting order statistics:', error);
            throw error;
        }
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=orderService.js.map