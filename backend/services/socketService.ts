import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '@/utils/logger';

export const setupSocketHandlers = (io: SocketIOServer): void => {
  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join user to their personal room for notifications
    socket.on('join-user-room', (userId: string) => {
      socket.join(`user-${userId}`);
      logger.info(`User ${userId} joined their personal room`);
    });

    // Join product room for inventory updates
    socket.on('join-product-room', (productId: string) => {
      socket.join(`product-${productId}`);
      logger.info(`User ${socket.id} joined product room: ${productId}`);
    });

    // Leave product room
    socket.on('leave-product-room', (productId: string) => {
      socket.leave(`product-${productId}`);
      logger.info(`User ${socket.id} left product room: ${productId}`);
    });

    // Handle cart updates
    socket.on('cart-update', (data) => {
      // Broadcast cart update to user's other sessions
      socket.broadcast.to(`user-${data.userId}`).emit('cart-updated', data);
    });

    // Handle order status updates
    socket.on('order-status-update', (data) => {
      io.to(`user-${data.userId}`).emit('order-status-changed', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Utility functions for emitting events
  io.emitInventoryUpdate = (productId: string, inventory: number) => {
    io.to(`product-${productId}`).emit('inventory-updated', {
      productId,
      inventory,
      timestamp: new Date().toISOString()
    });
  };

  io.emitOrderUpdate = (userId: string, orderData: any) => {
    io.to(`user-${userId}`).emit('order-updated', {
      ...orderData,
      timestamp: new Date().toISOString()
    });
  };

  io.emitNotification = (userId: string, notification: any) => {
    io.to(`user-${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  };
};

// Extend Socket.IO Server interface to include custom methods
declare module 'socket.io' {
  interface Server {
    emitInventoryUpdate(productId: string, inventory: number): void;
    emitOrderUpdate(userId: string, orderData: any): void;
    emitNotification(userId: string, notification: any): void;
  }
}
