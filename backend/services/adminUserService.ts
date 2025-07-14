import { User, AdminActivity } from '../models';
import { IUserSearchQuery, IUserUpdateRequest, IBulkUserOperation, IUserStats } from '../types/user';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AdminUserService {
  /**
   * Get all users with filtering, sorting, and pagination
   */
  static async getUsers(query: IUserSearchQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = query;

    // Build filter query
    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (typeof isEmailVerified === 'boolean') filter.isEmailVerified = isEmailVerified;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get user by ID with full details
   */
  static async getUserById(userId: string) {
    const user = await User.findById(userId)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
      .populate('wishlist', 'name price images')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user's order statistics
    const Order = require('../models/Order').default;
    const orderStats = await Order.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    return {
      ...user,
      orderStats: orderStats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 }
    };
  }

  /**
   * Update user by admin
   */
  static async updateUser(userId: string, updateData: IUserUpdateRequest, adminId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Store original data for activity logging
    const originalData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified
    };

    // Update user
    Object.assign(user, updateData);
    await user.save();

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      'update_user',
      'user',
      {
        userId,
        changes: updateData,
        originalData
      },
      userId
    );

    return user.toJSON();
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  static async deleteUser(userId: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'admin') {
      throw new AppError('Cannot delete admin users', 403);
    }

    user.isActive = false;
    await user.save();

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      'delete_user',
      'user',
      { userId, email: user.email },
      userId
    );

    return { message: 'User deleted successfully' };
  }

  /**
   * Bulk operations on users
   */
  static async bulkOperation(operation: IBulkUserOperation, adminId: string) {
    const { userIds, operation: op, data } = operation;

    if (!userIds || userIds.length === 0) {
      throw new AppError('No users selected', 400);
    }

    let updateQuery: any = {};
    let operationName = '';

    switch (op) {
      case 'activate':
        updateQuery = { isActive: true };
        operationName = 'bulk_activate_users';
        break;
      case 'deactivate':
        updateQuery = { isActive: false };
        operationName = 'bulk_deactivate_users';
        break;
      case 'updateRole':
        if (!data?.role) {
          throw new AppError('Role is required for role update operation', 400);
        }
        updateQuery = { role: data.role };
        operationName = 'bulk_update_user_roles';
        break;
      case 'delete':
        updateQuery = { isActive: false };
        operationName = 'bulk_delete_users';
        break;
      default:
        throw new AppError('Invalid bulk operation', 400);
    }

    // Prevent bulk operations on admin users for certain operations
    if (['delete', 'deactivate'].includes(op)) {
      const adminUsers = await User.find({ _id: { $in: userIds }, role: 'admin' });
      if (adminUsers.length > 0) {
        throw new AppError('Cannot perform this operation on admin users', 403);
      }
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateQuery
    );

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      operationName,
      'user',
      {
        userIds,
        operation: op,
        data,
        affectedCount: result.modifiedCount
      }
    );

    return {
      message: `Bulk operation completed successfully`,
      affectedCount: result.modifiedCount
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<IUserStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { user: 0, admin: 0, moderator: 0 });

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole: roleStats
    };
  }

  /**
   * Search users by email or name
   */
  static async searchUsers(searchTerm: string, limit: number = 10) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('firstName lastName email role isActive')
    .limit(limit)
    .lean();

    return users;
  }
}
