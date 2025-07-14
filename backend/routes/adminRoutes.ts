import express from 'express';
import { adminController } from '../controllers/adminController';
import { auth, adminAuth, authorize } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Apply authentication and admin authorization to all admin routes
router.use(auth);
router.use(adminAuth);

// ============ USER MANAGEMENT ROUTES ============

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private/Admin
router.get('/users', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    query('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be boolean'),
    query('sortBy').optional().isIn(['createdAt', 'lastLogin', 'firstName', 'email']).withMessage('Invalid sortBy field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
    handleValidationErrors
  ],
  adminController.getUsers
);

// @route   GET /api/admin/users/search
// @desc    Search users by name or email
// @access  Private/Admin
router.get('/users/search',
  [
    query('q').notEmpty().withMessage('Search term is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    handleValidationErrors
  ],
  adminController.searchUsers
);

// @route   GET /api/admin/users/stats
// @desc    Get user statistics
// @access  Private/Admin
router.get('/users/stats', adminController.getUserStats);

// @route   GET /api/admin/users/:id
// @desc    Get user by ID with detailed information
// @access  Private/Admin
router.get('/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
  ],
  adminController.getUserById
);

// @route   PUT /api/admin/users/:id
// @desc    Update user by admin
// @access  Private/Admin
router.put('/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be boolean'),
    handleValidationErrors
  ],
  adminController.updateUser
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private/Admin
router.delete('/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
  ],
  adminController.deleteUser
);

// @route   POST /api/admin/users/bulk
// @desc    Bulk operations on users
// @access  Private/Admin
router.post('/users/bulk',
  [
    body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID in userIds array'),
    body('operation').isIn(['activate', 'deactivate', 'delete', 'updateRole']).withMessage('Invalid operation'),
    body('data.role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
    body('data.isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    handleValidationErrors
  ],
  adminController.bulkUserOperation
);

// ============ PRODUCT MANAGEMENT ROUTES ============

// @route   GET /api/admin/products
// @desc    Get all products for admin (including inactive)
// @access  Private/Admin
router.get('/products',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']).withMessage('Invalid status'),
    query('category').optional().isMongoId().withMessage('Invalid category ID'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be positive'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
    query('inStock').optional().isBoolean().withMessage('inStock must be boolean'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'price', 'inventory']).withMessage('Invalid sortBy field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
    handleValidationErrors
  ],
  adminController.getAdminProducts
);

// @route   POST /api/admin/products/bulk
// @desc    Bulk operations on products
// @access  Private/Admin
router.post('/products/bulk',
  [
    body('productIds').isArray({ min: 1 }).withMessage('productIds must be a non-empty array'),
    body('productIds.*').isMongoId().withMessage('Invalid product ID in productIds array'),
    body('operation').isIn(['activate', 'deactivate', 'delete', 'updateCategory', 'updatePrice']).withMessage('Invalid operation'),
    body('data.categoryId').optional().isMongoId().withMessage('Invalid category ID'),
    body('data.priceMultiplier').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Price multiplier must be between 0.1 and 10'),
    body('data.fixedPrice').optional().isFloat({ min: 0 }).withMessage('Fixed price must be positive'),
    handleValidationErrors
  ],
  adminController.bulkProductOperation
);

// @route   PUT /api/admin/products/:id/inventory
// @desc    Update product inventory
// @access  Private/Admin
router.put('/products/:id/inventory',
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('operation').isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract'),
    handleValidationErrors
  ],
  adminController.updateProductInventory
);

// @route   GET /api/admin/products/low-stock
// @desc    Get low stock products
// @access  Private/Admin
router.get('/products/low-stock',
  [
    query('threshold').optional().isInt({ min: 1, max: 100 }).withMessage('Threshold must be between 1 and 100'),
    handleValidationErrors
  ],
  adminController.getLowStockProducts
);

// @route   GET /api/admin/products/out-of-stock
// @desc    Get out of stock products
// @access  Private/Admin
router.get('/products/out-of-stock', adminController.getOutOfStockProducts);

// @route   GET /api/admin/products/:id/performance
// @desc    Get product performance analytics
// @access  Private/Admin
router.get('/products/:id/performance',
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    handleValidationErrors
  ],
  adminController.getProductPerformance
);

// @route   POST /api/admin/products/import
// @desc    Import products from CSV
// @access  Private/Admin
router.post('/products/import',
  [
    body('csvData').isArray({ min: 1 }).withMessage('CSV data must be a non-empty array'),
    handleValidationErrors
  ],
  adminController.importProducts
);

// @route   GET /api/admin/products/export
// @desc    Export products to CSV
// @access  Private/Admin
router.get('/products/export', adminController.exportProducts);

// ============ PROMOTION MANAGEMENT ROUTES ============

// @route   GET /api/admin/promotions
// @desc    Get promotions with filtering and pagination
// @access  Private/Admin
router.get('/promotions',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['percentage', 'fixed', 'buy_one_get_one', 'free_shipping']).withMessage('Invalid promotion type'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    query('sortBy').optional().isIn(['createdAt', 'startDate', 'endDate', 'currentUsage']).withMessage('Invalid sortBy field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
    handleValidationErrors
  ],
  adminController.getPromotions
);

// @route   POST /api/admin/promotions
// @desc    Create new promotion
// @access  Private/Admin
router.post('/promotions',
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name must be 1-200 characters'),
    body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be 1-1000 characters'),
    body('code').trim().isLength({ min: 1, max: 50 }).withMessage('Code must be 1-50 characters'),
    body('type').isIn(['percentage', 'fixed', 'buy_one_get_one', 'free_shipping']).withMessage('Invalid promotion type'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
    body('maximumDiscountAmount').optional().isFloat({ min: 0 }).withMessage('Maximum discount amount must be positive'),
    body('applicableProducts').optional().isArray().withMessage('Applicable products must be an array'),
    body('applicableProducts.*').optional().isMongoId().withMessage('Invalid product ID'),
    body('applicableCategories').optional().isArray().withMessage('Applicable categories must be an array'),
    body('applicableCategories.*').optional().isMongoId().withMessage('Invalid category ID'),
    body('usageLimit').optional().isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
    body('usageLimitPerUser').optional().isInt({ min: 1 }).withMessage('Usage limit per user must be at least 1'),
    body('startDate').isISO8601().withMessage('Invalid start date format'),
    body('endDate').isISO8601().withMessage('Invalid end date format'),
    body('isActive').isBoolean().withMessage('isActive must be boolean'),
    handleValidationErrors
  ],
  adminController.createPromotion
);

// @route   GET /api/admin/promotions/:id
// @desc    Get promotion by ID
// @access  Private/Admin
router.get('/promotions/:id',
  [
    param('id').isMongoId().withMessage('Invalid promotion ID'),
    handleValidationErrors
  ],
  adminController.getPromotionById
);

// @route   PUT /api/admin/promotions/:id
// @desc    Update promotion
// @access  Private/Admin
router.put('/promotions/:id',
  [
    param('id').isMongoId().withMessage('Invalid promotion ID'),
    body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Name must be 1-200 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be 1-1000 characters'),
    body('code').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Code must be 1-50 characters'),
    body('type').optional().isIn(['percentage', 'fixed', 'buy_one_get_one', 'free_shipping']).withMessage('Invalid promotion type'),
    body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
    body('maximumDiscountAmount').optional().isFloat({ min: 0 }).withMessage('Maximum discount amount must be positive'),
    body('usageLimit').optional().isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
    body('usageLimitPerUser').optional().isInt({ min: 1 }).withMessage('Usage limit per user must be at least 1'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    handleValidationErrors
  ],
  adminController.updatePromotion
);

// @route   DELETE /api/admin/promotions/:id
// @desc    Delete promotion
// @access  Private/Admin
router.delete('/promotions/:id',
  [
    param('id').isMongoId().withMessage('Invalid promotion ID'),
    handleValidationErrors
  ],
  adminController.deletePromotion
);

// @route   POST /api/admin/promotions/validate
// @desc    Validate promotion code
// @access  Private/Admin
router.post('/promotions/validate',
  [
    body('code').trim().notEmpty().withMessage('Promotion code is required'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('orderAmount').isFloat({ min: 0 }).withMessage('Order amount must be positive'),
    body('productIds').optional().isArray().withMessage('Product IDs must be an array'),
    body('productIds.*').optional().isMongoId().withMessage('Invalid product ID'),
    body('categoryIds').optional().isArray().withMessage('Category IDs must be an array'),
    body('categoryIds.*').optional().isMongoId().withMessage('Invalid category ID'),
    handleValidationErrors
  ],
  adminController.validatePromotionCode
);

// ============ ANALYTICS ROUTES ============

// @route   GET /api/admin/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/analytics/dashboard', adminController.getDashboardStats);

// @route   GET /api/admin/analytics/sales
// @desc    Get sales analytics
// @access  Private/Admin
router.get('/analytics/sales',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    handleValidationErrors
  ],
  adminController.getSalesAnalytics
);

// @route   GET /api/admin/analytics/users
// @desc    Get user analytics
// @access  Private/Admin
router.get('/analytics/users',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    handleValidationErrors
  ],
  adminController.getUserAnalytics
);

// @route   GET /api/admin/analytics/products
// @desc    Get product analytics
// @access  Private/Admin
router.get('/analytics/products', adminController.getProductAnalytics);

// @route   GET /api/admin/analytics/orders
// @desc    Get order analytics
// @access  Private/Admin
router.get('/analytics/orders',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    handleValidationErrors
  ],
  adminController.getOrderAnalytics
);

export default router;
