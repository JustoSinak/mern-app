import Promotion, { PromotionUsage } from '../models/Promotion';
import { AdminActivity } from '../models';
import { ICreatePromotionRequest, IPromotionSearchQuery } from '../types/admin';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class PromotionService {
  /**
   * Create new promotion
   */
  static async createPromotion(promotionData: ICreatePromotionRequest, adminId: string) {
    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({ 
      code: promotionData.code.toUpperCase() 
    });
    
    if (existingPromotion) {
      throw new AppError('Promotion code already exists', 400);
    }

    // Validate dates
    const startDate = new Date(promotionData.startDate);
    const endDate = new Date(promotionData.endDate);
    
    if (startDate >= endDate) {
      throw new AppError('End date must be after start date', 400);
    }

    // Create promotion
    const promotion = new Promotion({
      ...promotionData,
      code: promotionData.code.toUpperCase(),
      startDate,
      endDate,
      createdBy: adminId
    });

    await promotion.save();

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      'create_promotion',
      'promotion',
      {
        promotionId: promotion._id,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value
      },
      promotion._id.toString()
    );

    return promotion;
  }

  /**
   * Get promotions with filtering and pagination
   */
  static async getPromotions(query: IPromotionSearchQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // Build filter query
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) filter.type = type;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [promotions, totalPromotions] = await Promise.all([
      Promotion.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('applicableProducts', 'name')
        .populate('applicableCategories', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Promotion.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalPromotions / limit);

    return {
      promotions,
      pagination: {
        currentPage: page,
        totalPages,
        totalPromotions,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get promotion by ID
   */
  static async getPromotionById(promotionId: string) {
    const promotion = await Promotion.findById(promotionId)
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableProducts', 'name price images')
      .populate('applicableCategories', 'name')
      .lean();

    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }

    // Get usage statistics
    const usageStats = await PromotionUsage.aggregate([
      { $match: { promotionId: promotion._id } },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    const stats = usageStats[0] || { totalUsage: 0, totalDiscount: 0, uniqueUsers: [] };

    return {
      ...promotion,
      usageStats: {
        totalUsage: stats.totalUsage,
        totalDiscount: stats.totalDiscount,
        uniqueUsers: stats.uniqueUsers.length
      }
    };
  }

  /**
   * Update promotion
   */
  static async updatePromotion(promotionId: string, updateData: Partial<ICreatePromotionRequest>, adminId: string) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }

    // Store original data for activity logging
    const originalData = {
      name: promotion.name,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      isActive: promotion.isActive
    };

    // Validate code uniqueness if code is being updated
    if (updateData.code && updateData.code.toUpperCase() !== promotion.code) {
      const existingPromotion = await Promotion.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: promotionId }
      });
      
      if (existingPromotion) {
        throw new AppError('Promotion code already exists', 400);
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate dates if being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : promotion.startDate;
      const endDate = updateData.endDate ? new Date(updateData.endDate) : promotion.endDate;
      
      if (startDate >= endDate) {
        throw new AppError('End date must be after start date', 400);
      }
      
      if (updateData.startDate) updateData.startDate = startDate.toISOString();
      if (updateData.endDate) updateData.endDate = endDate.toISOString();
    }

    // Update promotion
    Object.assign(promotion, updateData);
    await promotion.save();

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      'update_promotion',
      'promotion',
      {
        promotionId,
        changes: updateData,
        originalData
      },
      promotionId
    );

    return promotion;
  }

  /**
   * Delete promotion
   */
  static async deletePromotion(promotionId: string, adminId: string) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }

    // Check if promotion has been used
    const usageCount = await PromotionUsage.countDocuments({ promotionId });
    if (usageCount > 0) {
      // Soft delete by deactivating instead of hard delete
      promotion.isActive = false;
      await promotion.save();
      
      await AdminActivity.logActivity(
        adminId,
        'deactivate_promotion',
        'promotion',
        { promotionId, code: promotion.code, reason: 'Had usage history' },
        promotionId
      );
      
      return { message: 'Promotion deactivated (had usage history)' };
    } else {
      // Hard delete if no usage
      await Promotion.findByIdAndDelete(promotionId);
      
      await AdminActivity.logActivity(
        adminId,
        'delete_promotion',
        'promotion',
        { promotionId, code: promotion.code },
        promotionId
      );
      
      return { message: 'Promotion deleted successfully' };
    }
  }

  /**
   * Validate promotion code for order
   */
  static async validatePromotionCode(
    code: string, 
    userId: string, 
    orderAmount: number,
    productIds?: string[],
    categoryIds?: string[]
  ) {
    const promotion = await Promotion.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!promotion) {
      throw new AppError('Invalid promotion code', 400);
    }

    // Check if promotion is currently valid
    const now = new Date();
    if (promotion.startDate > now || promotion.endDate < now) {
      throw new AppError('Promotion code is not currently valid', 400);
    }

    // Check usage limits
    if (promotion.usageLimit && promotion.currentUsage >= promotion.usageLimit) {
      throw new AppError('Promotion code usage limit exceeded', 400);
    }

    // Check per-user usage limit
    if (promotion.usageLimitPerUser) {
      const userUsageCount = await PromotionUsage.countDocuments({
        promotionId: promotion._id,
        userId
      });
      
      if (userUsageCount >= promotion.usageLimitPerUser) {
        throw new AppError('You have exceeded the usage limit for this promotion', 400);
      }
    }

    // Check minimum order amount
    if (promotion.minimumOrderAmount && orderAmount < promotion.minimumOrderAmount) {
      throw new AppError(`Minimum order amount of $${promotion.minimumOrderAmount} required`, 400);
    }

    // Check product/category applicability
    if (promotion.applicableProducts && promotion.applicableProducts.length > 0) {
      if (!productIds || !productIds.some(id => promotion.applicableProducts!.includes(id as any))) {
        throw new AppError('Promotion not applicable to items in cart', 400);
      }
    }

    if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
      if (!categoryIds || !categoryIds.some(id => promotion.applicableCategories!.includes(id as any))) {
        throw new AppError('Promotion not applicable to items in cart', 400);
      }
    }

    // Calculate discount
    const discountAmount = promotion.calculateDiscount(orderAmount);

    return {
      promotion,
      discountAmount,
      isValid: true
    };
  }

  /**
   * Apply promotion to order
   */
  static async applyPromotion(promotionId: string, userId: string, orderId: string, discountAmount: number) {
    // Record promotion usage
    const usage = new PromotionUsage({
      promotionId,
      userId,
      orderId,
      discountAmount
    });
    
    await usage.save();

    // Update promotion current usage
    await Promotion.findByIdAndUpdate(
      promotionId,
      { $inc: { currentUsage: 1 } }
    );

    return usage;
  }

  /**
   * Get promotion usage statistics
   */
  static async getPromotionStats() {
    const stats = await Promotion.aggregate([
      {
        $group: {
          _id: null,
          totalPromotions: { $sum: 1 },
          activePromotions: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalUsage: { $sum: '$currentUsage' }
        }
      }
    ]);

    const usageStats = await PromotionUsage.aggregate([
      {
        $group: {
          _id: null,
          totalDiscountGiven: { $sum: '$discountAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    return {
      ...stats[0],
      ...usageStats[0]
    };
  }
}
