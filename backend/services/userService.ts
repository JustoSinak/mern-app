import { User, Order, AdminActivity } from '../models';
import { IUser, IAddress } from '../types/user';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

export class UserService {
  /**
   * Get user profile with additional statistics
   */
  static async getUserProfile(userId: string) {
    const user = await User.findById(userId)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
      .populate('wishlist', 'name price images averageRating')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user statistics
    const stats = await this.getUserStatistics(userId);

    return {
      ...user,
      statistics: stats
    };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updateData: Partial<IUser>) {
    // Remove sensitive fields that shouldn't be updated via this method
    const sanitizedData = { ...updateData };
    delete sanitizedData.password;
    delete sanitizedData.role;
    delete sanitizedData.isActive;
    delete sanitizedData.isEmailVerified;
    delete sanitizedData.refreshTokens;
    delete sanitizedData.emailVerificationToken;
    delete sanitizedData.passwordResetToken;

    const user = await User.findByIdAndUpdate(
      userId,
      sanitizedData,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Get user orders with pagination
   */
  static async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.productId', 'name images price')
        .lean(),
      Order.countDocuments({ userId })
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(userId: string) {
    const [orderStats, wishlistCount] = await Promise.all([
      Order.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            lastOrderDate: { $max: '$createdAt' }
          }
        }
      ]),
      User.aggregate([
        { $match: { _id: new Types.ObjectId(userId) } },
        { $project: { wishlistCount: { $size: '$wishlist' } } }
      ])
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null
    };

    const wishlist = wishlistCount[0] || { wishlistCount: 0 };

    return {
      ...stats,
      wishlistCount: wishlist.wishlistCount
    };
  }

  /**
   * Manage user wishlist
   */
  static async addToWishlist(userId: string, productId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId as any)) {
      throw new AppError('Product already in wishlist', 400);
    }

    user.wishlist.push(productId as any);
    await user.save();

    return { message: 'Product added to wishlist' };
  }

  static async removeFromWishlist(userId: string, productId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);

    if (user.wishlist.length === initialLength) {
      throw new AppError('Product not found in wishlist', 404);
    }

    await user.save();
    return { message: 'Product removed from wishlist' };
  }

  static async getWishlist(userId: string) {
    const user = await User.findById(userId)
      .populate('wishlist', 'name price images averageRating reviewCount status inventory')
      .select('wishlist')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.wishlist;
  }

  /**
   * Address management
   */
  static async addAddress(userId: string, addressData: IAddress) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If this is the first address or marked as default, make it default
    if (user.addresses.length === 0 || addressData.isDefault) {
      // Remove default from other addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    return user.addresses[user.addresses.length - 1];
  }

  static async updateAddress(userId: string, addressId: string, updateData: Partial<IAddress>) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new AppError('Address not found', 404);
    }

    // If setting as default, remove default from other addresses
    if (updateData.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    Object.assign(address, updateData);
    await user.save();

    return address;
  }

  static async deleteAddress(userId: string, addressId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new AppError('Address not found', 404);
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    // If deleted address was default, make the first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return { message: 'Address deleted successfully' };
  }

  static async getAddresses(userId: string) {
    const user = await User.findById(userId).select('addresses').lean();
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.addresses;
  }

  /**
   * Account management
   */
  static async deactivateAccount(userId: string, reason?: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = false;
    await user.save();

    // Log the account deactivation
    await AdminActivity.logActivity(
      userId,
      'deactivate_account',
      'user',
      { reason: reason || 'User requested account deletion' },
      userId
    );

    return { message: 'Account deactivated successfully' };
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, preferences: Partial<IUser['preferences']>) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true, runValidators: true }
    ).select('preferences');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.preferences;
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [recentOrders, recentActivity] = await Promise.all([
      Order.find({
        userId,
        createdAt: { $gte: startDate }
      })
      .select('orderNumber status totalAmount createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

      AdminActivity.find({
        adminId: userId,
        timestamp: { $gte: startDate }
      })
      .select('action resource timestamp details')
      .sort({ timestamp: -1 })
      .limit(20)
      .lean()
    ]);

    return {
      recentOrders,
      recentActivity
    };
  }
}
