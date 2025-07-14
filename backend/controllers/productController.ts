import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ProductService } from '../services/productService';
import { AuthenticatedRequest } from '../types/common';
import { ICreateProductRequest, IUpdateProductRequest, IProductSearchQuery, IAddReviewRequest } from '../types/product';
import { logger } from '../utils/logger';

export const productController = {
  /**
   * Get products with filtering, sorting, and pagination
   * @route GET /api/products
   * @access Public
   */
  getProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const query: IProductSearchQuery = req.query;
    const result = await ProductService.getProducts(query);

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  }),

  /**
   * Search products
   * @route GET /api/products/search
   * @access Public
   */
  searchProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q, ...filters } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const products = await ProductService.searchProducts(q as string, filters);

    res.json({
      success: true,
      data: products
    });
  }),

  /**
   * Get all product categories
   * @route GET /api/products/categories
   * @access Public
   */
  getCategories: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const categories = await ProductService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  }),

  /**
   * Get featured products
   * @route GET /api/products/featured
   * @access Public
   */
  getFeaturedProducts: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await ProductService.getFeaturedProducts(limit);

    res.json({
      success: true,
      data: products
    });
  }),

  /**
   * Get product recommendations for user
   * @route GET /api/products/recommendations/:userId
   * @access Private
   */
  getRecommendations: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement ML-based recommendations
    // For now, return featured products
    const products = await ProductService.getFeaturedProducts(10);

    res.json({
      success: true,
      data: products,
      message: 'Basic recommendations (ML recommendations coming soon)'
    });
  }),

  /**
   * Get single product
   * @route GET /api/products/:id
   * @access Public
   */
  getProduct: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
      return;
    }

    const product = await ProductService.getProduct(id);

    res.json({
      success: true,
      data: product
    });
  }),

  /**
   * Create new product
   * @route POST /api/products
   * @access Private/Admin
   */
  createProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const productData: ICreateProductRequest = req.body;
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const product = await ProductService.createProduct(productData, userId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  }),

  /**
   * Update product
   * @route PUT /api/products/:id
   * @access Private/Admin
   */
  updateProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const updateData: IUpdateProductRequest = req.body;
    const userId = req.user?._id?.toString();

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required'
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

    const product = await ProductService.updateProduct(id, updateData, userId);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  }),

  /**
   * Delete product
   * @route DELETE /api/products/:id
   * @access Private/Admin
   */
  deleteProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?._id?.toString();

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required'
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

    const result = await ProductService.deleteProduct(id, userId);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Add product review
   * @route POST /api/products/:id/reviews
   * @access Private
   */
  addReview: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const reviewData: IAddReviewRequest = req.body;
    const user = req.user;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
      return;
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const product = await ProductService.addReview(
      id,
      reviewData,
      user._id.toString(),
      `${user.firstName} ${user.lastName}`,
      user.avatar
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: product
    });
  }),

  /**
   * Update product review
   * @route PUT /api/products/:id/reviews/:reviewId
   * @access Private
   */
  updateReview: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement review update
    res.status(501).json({
      success: false,
      message: 'Review update not implemented yet'
    });
  }),

  /**
   * Delete product review
   * @route DELETE /api/products/:id/reviews/:reviewId
   * @access Private
   */
  deleteReview: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement review deletion
    res.status(501).json({
      success: false,
      message: 'Review deletion not implemented yet'
    });
  }),

  /**
   * Update product inventory
   * @route PUT /api/products/:id/inventory
   * @access Private/Admin
   */
  updateInventory: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { quantity, operation } = req.body;
    const userId = req.user?._id?.toString();

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required'
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

    const product = await ProductService.updateInventory(id, quantity, operation, userId);

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        productId: product._id,
        name: product.name,
        inventory: product.inventory
      }
    });
  })
};
