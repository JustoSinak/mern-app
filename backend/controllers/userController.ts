import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types/common';
import { UserService } from '../services/userService';
import { logger } from '../utils/logger';

export const userController = {
  /**
   * Get user profile
   * @route GET /api/users/profile
   * @access Private
   */
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await UserService.getUserProfile(userId);

    res.json({
      success: true,
      data: user
    });
  }),

  /**
   * Update user profile
   * @route PUT /api/users/profile
   * @access Private
   */
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await UserService.updateUserProfile(userId, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  }),

  /**
   * Delete user account (soft delete)
   * @route DELETE /api/users/profile
   * @access Private
   */
  deleteAccount: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { reason } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await UserService.deactivateAccount(userId, reason);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Get user orders
   * @route GET /api/users/orders
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

    const result = await UserService.getUserOrders(userId, page, limit);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  }),

  /**
   * Get user wishlist
   * @route GET /api/users/wishlist
   * @access Private
   */
  getWishlist: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const wishlist = await UserService.getWishlist(userId);

    res.json({
      success: true,
      data: wishlist
    });
  }),

  /**
   * Add product to wishlist
   * @route POST /api/users/wishlist/:productId
   * @access Private
   */
  addToWishlist: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await UserService.addToWishlist(userId, productId);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Remove product from wishlist
   * @route DELETE /api/users/wishlist/:productId
   * @access Private
   */
  removeFromWishlist: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await UserService.removeFromWishlist(userId, productId);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Get user addresses
   * @route GET /api/users/addresses
   * @access Private
   */
  getAddresses: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const addresses = await UserService.getAddresses(userId);

    res.json({
      success: true,
      data: addresses
    });
  }),

  /**
   * Add new address
   * @route POST /api/users/addresses
   * @access Private
   */
  addAddress: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const addressData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const address = await UserService.addAddress(userId, addressData);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  }),

  /**
   * Update address
   * @route PUT /api/users/addresses/:addressId
   * @access Private
   */
  updateAddress: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { addressId } = req.params;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const address = await UserService.updateAddress(userId, addressId, updateData);

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  }),

  /**
   * Delete address
   * @route DELETE /api/users/addresses/:addressId
   * @access Private
   */
  deleteAddress: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { addressId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await UserService.deleteAddress(userId, addressId);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Change user password
   * @route POST /api/users/change-password
   * @access Private
   */
  changePassword: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await UserService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: result.message
    });
  }),

  /**
   * Update user preferences
   * @route PUT /api/users/preferences
   * @access Private
   */
  updatePreferences: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const preferences = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const updatedPreferences = await UserService.updatePreferences(userId, preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences
    });
  }),

  /**
   * Get user activity summary
   * @route GET /api/users/activity
   * @access Private
   */
  getUserActivity: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString();
    const days = parseInt(req.query.days as string) || 30;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const activity = await UserService.getUserActivity(userId, days);

    res.json({
      success: true,
      data: activity
    });
  })
};
};
