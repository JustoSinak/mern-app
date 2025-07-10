"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const logger_1 = require("@/utils/logger");
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        logger_1.logger.info(`User connected: ${socket.id}`);
        socket.on('join-user-room', (userId) => {
            socket.join(`user-${userId}`);
            logger_1.logger.info(`User ${userId} joined their personal room`);
        });
        socket.on('join-product-room', (productId) => {
            socket.join(`product-${productId}`);
            logger_1.logger.info(`User ${socket.id} joined product room: ${productId}`);
        });
        socket.on('leave-product-room', (productId) => {
            socket.leave(`product-${productId}`);
            logger_1.logger.info(`User ${socket.id} left product room: ${productId}`);
        });
        socket.on('cart-update', (data) => {
            socket.broadcast.to(`user-${data.userId}`).emit('cart-updated', data);
        });
        socket.on('order-status-update', (data) => {
            io.to(`user-${data.userId}`).emit('order-status-changed', data);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`User disconnected: ${socket.id}`);
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`Socket error for ${socket.id}:`, error);
        });
    });
    io.emitInventoryUpdate = (productId, inventory) => {
        io.to(`product-${productId}`).emit('inventory-updated', {
            productId,
            inventory,
            timestamp: new Date().toISOString()
        });
    };
    io.emitOrderUpdate = (userId, orderData) => {
        io.to(`user-${userId}`).emit('order-updated', {
            ...orderData,
            timestamp: new Date().toISOString()
        });
    };
    io.emitNotification = (userId, notification) => {
        io.to(`user-${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString()
        });
    };
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketService.js.map