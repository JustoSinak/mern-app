import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { CartService } from '@/services/cartService';
import { AuthenticatedRequest } from '@/types/common';
import { IAddToCartRequest } from '@/types/order';

export const cartController = {
  /**
   * Get user cart
   * @route GET /api/cart
   * @access Private/Public (with session)
   */
  getCart: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await CartService.getCart(userId, sessionId);

    res.json({
      success: true,
      data: cart
    });
  }),

  /**
   * Add item to cart
   * @route POST /api/cart/items
   * @access Private/Public (with session)
   */
  addItem: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { productId, quantity, variantId }: IAddToCartRequest = req.body;
    const userId = req.user?._id?.toString();
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await CartService.addItem(productId, quantity, variantId, userId, sessionId);

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  }),

  /**
   * Update cart item quantity
   * @route PUT /api/cart/items/:itemId
   * @access Private/Public (with session)
   */
  updateItem: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?._id?.toString();
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    if (!itemId) {
      res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
      return;
    }

    const cart = await CartService.updateItem(itemId, quantity, userId, sessionId);

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });
  }),

  /**
   * Remove item from cart
   * @route DELETE /api/cart/items/:itemId
   * @access Private/Public (with session)
   */
  removeItem: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { itemId } = req.params;
    const userId = req.user?._id?.toString();
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    if (!itemId) {
      res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
      return;
    }

    const cart = await CartService.removeItem(itemId, userId, sessionId);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  }),

  /**
   * Clear cart
   * @route DELETE /api/cart
   * @access Private/Public (with session)
   */
  clearCart: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await CartService.clearCart(userId, sessionId);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  }),

  /**
   * Merge guest cart with user cart
   * @route POST /api/cart/merge
   * @access Private
   */
  mergeCart: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { sessionId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const cart = await CartService.mergeCart(userId, sessionId);

    res.json({
      success: true,
      message: 'Carts merged successfully',
      data: cart
    });
  }),

  /**
   * Get cart summary
   * @route GET /api/cart/summary
   * @access Private/Public (with session)
   */
  getCartSummary: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const summary = await CartService.getCartSummary(userId, sessionId);

    res.json({
      success: true,
      data: summary
    });
  })
};
