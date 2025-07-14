import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types/common';
import { AdminUserService } from '../services/adminUserService';
import { AdminProductService } from '../services/adminProductService';
import { PromotionService } from '../services/promotionService';
import { AnalyticsService } from '../services/analyticsService';
import { IUserSearchQuery, IUserUpdateRequest, IBulkUserOperation } from '../types/user';
import { IProductSearchQuery } from '../types/product';
import { ICreatePromotionRequest, IPromotionSearchQuery, IBulkProductOperation } from '../types/admin';

export const adminController = {
  // ============ USER MANAGEMENT ============
  
  /**
   * Get all users with filtering and pagination
   * @route GET /api/admin/users
   * @access Private/Admin
   */
  getUsers: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const query: IUserSearchQuery = req.query;
    const result = await AdminUserService.getUsers(query);

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  }),

  /**
   * Get user by ID with detailed information
   * @route GET /api/admin/users/:id
   * @access Private/Admin
   */
  getUserById: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = await AdminUserService.getUserById(id);

    res.json({
      success: true,
      data: user
    });
  }),

  /**
   * Update user by admin
   * @route PUT /api/admin/users/:id
   * @access Private/Admin
   */
  updateUser: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const updateData: IUserUpdateRequest = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await AdminUserService.updateUser(id, updateData, adminId);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  }),

  /**
   * Delete user (soft delete)
   * @route DELETE /api/admin/users/:id
   * @access Private/Admin
   */
  deleteUser: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AdminUserService.deleteUser(id, adminId);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Bulk operations on users
   * @route POST /api/admin/users/bulk
   * @access Private/Admin
   */
  bulkUserOperation: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const operation: IBulkUserOperation = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AdminUserService.bulkOperation(operation, adminId);

    res.json({
      success: true,
      message: result.message,
      data: { affectedCount: result.affectedCount }
    });
  }),

  /**
   * Get user statistics
   * @route GET /api/admin/users/stats
   * @access Private/Admin
   */
  getUserStats: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await AdminUserService.getUserStats();

    res.json({
      success: true,
      data: stats
    });
  }),

  /**
   * Search users
   * @route GET /api/admin/users/search
   * @access Private/Admin
   */
  searchUsers: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: searchTerm, limit } = req.query;
    
    if (!searchTerm) {
      res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
      return;
    }

    const users = await AdminUserService.searchUsers(
      searchTerm as string, 
      parseInt(limit as string) || 10
    );

    res.json({
      success: true,
      data: users
    });
  }),

  // ============ PRODUCT MANAGEMENT ============

  /**
   * Get all products for admin (including inactive)
   * @route GET /api/admin/products
   * @access Private/Admin
   */
  getAdminProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const query: IProductSearchQuery = req.query;
    const result = await AdminProductService.getAdminProducts(query);

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  }),

  /**
   * Bulk operations on products
   * @route POST /api/admin/products/bulk
   * @access Private/Admin
   */
  bulkProductOperation: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const operation: IBulkProductOperation = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AdminProductService.bulkOperation(operation, adminId);

    res.json({
      success: true,
      message: result.message,
      data: { affectedCount: result.affectedCount }
    });
  }),

  /**
   * Update product inventory
   * @route PUT /api/admin/products/:id/inventory
   * @access Private/Admin
   */
  updateProductInventory: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { quantity, operation } = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const product = await AdminProductService.updateInventory(id, quantity, operation, adminId);

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: product
    });
  }),

  /**
   * Get low stock products
   * @route GET /api/admin/products/low-stock
   * @access Private/Admin
   */
  getLowStockProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const threshold = parseInt(req.query.threshold as string) || 10;
    const products = await AdminProductService.getLowStockProducts(threshold);

    res.json({
      success: true,
      data: products
    });
  }),

  /**
   * Get out of stock products
   * @route GET /api/admin/products/out-of-stock
   * @access Private/Admin
   */
  getOutOfStockProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const products = await AdminProductService.getOutOfStockProducts();

    res.json({
      success: true,
      data: products
    });
  }),

  /**
   * Get product performance analytics
   * @route GET /api/admin/products/:id/performance
   * @access Private/Admin
   */
  getProductPerformance: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const performance = await AdminProductService.getProductPerformance(id, days);

    res.json({
      success: true,
      data: performance
    });
  }),

  /**
   * Import products from CSV
   * @route POST /api/admin/products/import
   * @access Private/Admin
   */
  importProducts: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { csvData } = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!csvData || !Array.isArray(csvData)) {
      res.status(400).json({
        success: false,
        message: 'CSV data is required and must be an array'
      });
      return;
    }

    const result = await AdminProductService.importProducts(csvData, adminId);

    res.json({
      success: true,
      message: 'Product import completed',
      data: result
    });
  }),

  /**
   * Export products to CSV
   * @route GET /api/admin/products/export
   * @access Private/Admin
   */
  exportProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const filters = req.query;
    const csvData = await AdminProductService.exportProducts(filters);

    res.json({
      success: true,
      data: csvData
    });
  }),

  // ============ PROMOTION MANAGEMENT ============

  /**
   * Create new promotion
   * @route POST /api/admin/promotions
   * @access Private/Admin
   */
  createPromotion: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const promotionData: ICreatePromotionRequest = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const promotion = await PromotionService.createPromotion(promotionData, adminId);

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion
    });
  }),

  /**
   * Get promotions with filtering and pagination
   * @route GET /api/admin/promotions
   * @access Private/Admin
   */
  getPromotions: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const query: IPromotionSearchQuery = req.query;
    const result = await PromotionService.getPromotions(query);

    res.json({
      success: true,
      data: result.promotions,
      pagination: result.pagination
    });
  }),

  /**
   * Get promotion by ID
   * @route GET /api/admin/promotions/:id
   * @access Private/Admin
   */
  getPromotionById: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const promotion = await PromotionService.getPromotionById(id);

    res.json({
      success: true,
      data: promotion
    });
  }),

  /**
   * Update promotion
   * @route PUT /api/admin/promotions/:id
   * @access Private/Admin
   */
  updatePromotion: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const updateData: Partial<ICreatePromotionRequest> = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const promotion = await PromotionService.updatePromotion(id, updateData, adminId);

    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion
    });
  }),

  /**
   * Delete promotion
   * @route DELETE /api/admin/promotions/:id
   * @access Private/Admin
   */
  deletePromotion: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await PromotionService.deletePromotion(id, adminId);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Validate promotion code
   * @route POST /api/admin/promotions/validate
   * @access Private/Admin
   */
  validatePromotionCode: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code, userId, orderAmount, productIds, categoryIds } = req.body;

    const result = await PromotionService.validatePromotionCode(
      code,
      userId,
      orderAmount,
      productIds,
      categoryIds
    );

    res.json({
      success: true,
      data: result
    });
  }),

  // ============ ANALYTICS ============

  /**
   * Get dashboard statistics
   * @route GET /api/admin/analytics/dashboard
   * @access Private/Admin
   */
  getDashboardStats: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await AnalyticsService.getDashboardStats();

    res.json({
      success: true,
      data: stats
    });
  }),

  /**
   * Get sales analytics
   * @route GET /api/admin/analytics/sales
   * @access Private/Admin
   */
  getSalesAnalytics: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await AnalyticsService.getSalesAnalytics(days);

    res.json({
      success: true,
      data: analytics
    });
  }),

  /**
   * Get user analytics
   * @route GET /api/admin/analytics/users
   * @access Private/Admin
   */
  getUserAnalytics: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await AnalyticsService.getUserAnalytics(days);

    res.json({
      success: true,
      data: analytics
    });
  }),

  /**
   * Get product analytics
   * @route GET /api/admin/analytics/products
   * @access Private/Admin
   */
  getProductAnalytics: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const analytics = await AnalyticsService.getProductAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  }),

  /**
   * Get order analytics
   * @route GET /api/admin/analytics/orders
   * @access Private/Admin
   */
  getOrderAnalytics: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await AnalyticsService.getOrderAnalytics(days);

    res.json({
      success: true,
      data: analytics
    });
  })
};
