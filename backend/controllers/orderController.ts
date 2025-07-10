import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { OrderService } from '@/services/orderService';
import { AuthenticatedRequest } from '@/types/common';
import { ICreateOrderRequest } from '@/types/order';

export const orderController = {
  /**
   * Create new order
   * @route POST /api/orders
   * @access Private
   */
  createOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const orderData: ICreateOrderRequest = req.body;
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const order = await OrderService.createOrder(orderData, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  }),

  /**
   * Get user orders
   * @route GET /api/orders
   * @access Private
   */
  getUserOrders: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await OrderService.getUserOrders(userId, page, limit);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  }),

  /**
   * Get all orders (admin)
   * @route GET /api/orders/all
   * @access Private/Admin
   */
  getAllOrders: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await OrderService.getAllOrders(page, limit, status);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  }),

  /**
   * Get order by ID
   * @route GET /api/orders/:id
   * @access Private
   */
  getOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Non-admin users can only see their own orders
    const order = await OrderService.getOrder(id, isAdmin ? undefined : userId);

    res.json({
      success: true,
      data: order
    });
  }),

  /**
   * Update order status
   * @route PUT /api/orders/:id/status
   * @access Private/Admin
   */
  updateOrderStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const order = await OrderService.updateOrderStatus(
      id,
      status,
      message,
      trackingNumber,
      location,
      adminUserId
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  }),

  /**
   * Cancel order
   * @route POST /api/orders/:id/cancel
   * @access Private
   */
  cancelOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const order = await OrderService.cancelOrder(id, userId, reason);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  }),

  /**
   * Process refund
   * @route POST /api/orders/:id/refund
   * @access Private/Admin
   */
  processRefund: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const order = await OrderService.processRefund(id, amount, reason, adminUserId);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: order
    });
  }),

  /**
   * Get order tracking information
   * @route GET /api/orders/:id/tracking
   * @access Private
   */
  getOrderTracking: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const tracking = await OrderService.getOrderTracking(id, isAdmin ? undefined : userId);

    res.json({
      success: true,
      data: tracking
    });
  }),

  /**
   * Request order return
   * @route POST /api/orders/:id/return
   * @access Private
   */
  requestReturn: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const order = await OrderService.requestReturn(id, userId, reason, items);

    res.json({
      success: true,
      message: 'Return request submitted successfully',
      data: order
    });
  })
};
