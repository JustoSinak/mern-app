import { Order, Cart, Product } from '@/models';
import { CartService } from './cartService';
import { AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { Types } from 'mongoose';
import { ICreateOrderRequest, IOrderTracking } from '@/types/order';

export class OrderService {
  /**
   * Create new order
   */
  static async createOrder(orderData: ICreateOrderRequest, userId: string) {
    try {
      // Validate cart
      const cartValidation = await CartService.validateCartForCheckout(userId);
      const cart = cartValidation.cart;

      // Calculate totals
      const subtotal = cart.subtotal;
      const taxRate = 0.08; // 8% tax rate (should be configurable)
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const shippingAmount = orderData.shippingMethod.price;
      const discountAmount = 0; // TODO: Implement coupon system
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

      // Reserve inventory
      const reservations = await CartService.reserveInventory(cart._id.toString());

      try {
        // Create order items from cart
        const orderItems = cart.items.map((item: any) => ({
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

        // Create order
        const order = new Order({
          userId: new Types.ObjectId(userId),
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

        // Add initial tracking
        order.addTrackingUpdate('pending', 'Order created and awaiting payment');

        await order.save();

        // Clear cart after successful order creation
        await CartService.clearCart(userId);

        logger.info(`Order created: ${order.orderNumber} for user ${userId}`);
        return order;

      } catch (error) {
        // Release reserved inventory on error
        await CartService.releaseInventory(reservations);
        throw error;
      }
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  static async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments({ userId })
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
    } catch (error) {
      logger.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * Get all orders (admin)
   */
  static async getAllOrders(page: number = 1, limit: number = 20, status?: string) {
    try {
      const skip = (page - 1) * limit;
      const filter = status ? { status } : {};

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
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
    } catch (error) {
      logger.error('Error getting all orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string, userId?: string) {
    try {
      const filter: any = { _id: orderId };
      if (userId) {
        filter.userId = userId;
      }

      const order = await Order.findOne(filter)
        .populate('userId', 'firstName lastName email')
        .lean();

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      return order;
    } catch (error) {
      logger.error('Error getting order:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: IOrderTracking['status'],
    message?: string,
    trackingNumber?: string,
    location?: string,
    adminUserId?: string
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Add tracking update
      order.addTrackingUpdate(status, message || `Order status updated to ${status}`, location);

      // Update tracking number if provided
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      // Set estimated delivery date for shipped orders
      if (status === 'shipped' && order.shippingMethod.estimatedDays) {
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + order.shippingMethod.estimatedDays);
        order.estimatedDeliveryDate = estimatedDate;
      }

      await order.save();

      logger.info(`Order ${order.orderNumber} status updated to ${status} by ${adminUserId || 'system'}`);
      return order;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, userId: string, reason?: string) {
    try {
      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (!order.canBeCancelled()) {
        throw new AppError('Order cannot be cancelled at this stage', 400);
      }

      // Release inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { inventory: item.quantity } }
        );
      }

      // Update order status
      order.addTrackingUpdate('cancelled', reason || 'Order cancelled by customer');
      await order.save();

      logger.info(`Order ${order.orderNumber} cancelled by user ${userId}`);
      return order;
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(orderId: string, amount: number, reason: string, adminUserId: string) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.paymentDetails.status !== 'completed') {
        throw new AppError('Cannot refund unpaid order', 400);
      }

      // TODO: Integrate with Stripe refund API
      // For now, just update the order
      order.paymentDetails.status = amount >= order.totalAmount ? 'refunded' : 'partially_refunded';
      order.paymentDetails.refundedAmount = (order.paymentDetails.refundedAmount || 0) + amount;
      order.paymentDetails.refundedAt = new Date();

      order.addTrackingUpdate('cancelled', `Refund processed: $${amount.toFixed(2)} - ${reason}`);
      await order.save();

      logger.info(`Refund processed for order ${order.orderNumber}: $${amount} by ${adminUserId}`);
      return order;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get order tracking information
   */
  static async getOrderTracking(orderId: string, userId?: string) {
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
    } catch (error) {
      logger.error('Error getting order tracking:', error);
      throw error;
    }
  }

  /**
   * Request order return
   */
  static async requestReturn(orderId: string, userId: string, reason: string, items?: any[]) {
    try {
      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (!order.canBeReturned()) {
        throw new AppError('Order cannot be returned', 400);
      }

      order.returnRequested = true;
      order.returnReason = reason;
      order.returnStatus = 'pending';
      order.returnRequestedAt = new Date();

      order.addTrackingUpdate('returned', `Return requested: ${reason}`);
      await order.save();

      logger.info(`Return requested for order ${order.orderNumber} by user ${userId}`);
      return order;
    } catch (error) {
      logger.error('Error requesting return:', error);
      throw error;
    }
  }

  /**
   * Get order statistics (admin)
   */
  static async getOrderStatistics() {
    try {
      const stats = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);

      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { 'paymentDetails.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats
      };
    } catch (error) {
      logger.error('Error getting order statistics:', error);
      throw error;
    }
  }
}
