import mongoose, { Schema } from 'mongoose';
import { IPromotion, IPromotionUsage } from '../types/admin';

// Promotion Usage Schema
const promotionUsageSchema = new Schema<IPromotionUsage>({
  promotionId: {
    type: Schema.Types.ObjectId,
    ref: 'Promotion',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
});

// Promotion Schema
const promotionSchema = new Schema<IPromotion>({
  name: {
    type: String,
    required: [true, 'Promotion name is required'],
    trim: true,
    maxlength: [200, 'Promotion name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Promotion description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  code: {
    type: String,
    required: [true, 'Promotion code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [50, 'Promotion code cannot exceed 50 characters'],
    match: [/^[A-Z0-9_-]+$/, 'Promotion code can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  type: {
    type: String,
    required: [true, 'Promotion type is required'],
    enum: ['percentage', 'fixed', 'buy_one_get_one', 'free_shipping']
  },
  value: {
    type: Number,
    required: [true, 'Promotion value is required'],
    min: [0, 'Promotion value cannot be negative']
  },
  
  // Conditions
  minimumOrderAmount: {
    type: Number,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maximumDiscountAmount: {
    type: Number,
    min: [0, 'Maximum discount amount cannot be negative']
  },
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Usage limits
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1']
  },
  usageLimitPerUser: {
    type: Number,
    min: [1, 'Usage limit per user must be at least 1']
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: [0, 'Current usage cannot be negative']
  },
  
  // Date constraints
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ type: 1 });
promotionSchema.index({ createdBy: 1 });

// Promotion Usage indexes
promotionUsageSchema.index({ promotionId: 1 });
promotionUsageSchema.index({ userId: 1 });
promotionUsageSchema.index({ orderId: 1 });
promotionUsageSchema.index({ usedAt: -1 });

// Virtual for checking if promotion is currently valid
promotionSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.usageLimit || this.currentUsage < this.usageLimit);
});

// Virtual for usage statistics
promotionSchema.virtual('usageStats', {
  ref: 'PromotionUsage',
  localField: '_id',
  foreignField: 'promotionId'
});

// Pre-save validation
promotionSchema.pre('save', function(next) {
  // Validate date range
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate percentage values
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  // Validate maximum discount for percentage promotions
  if (this.type === 'percentage' && this.maximumDiscountAmount && this.maximumDiscountAmount <= 0) {
    return next(new Error('Maximum discount amount must be positive'));
  }
  
  next();
});

// Static method to find valid promotions for a given context
promotionSchema.statics.findValidPromotions = function(context: {
  code?: string;
  userId?: string;
  orderAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
}) {
  const now = new Date();
  const query: any = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  };

  if (context.code) {
    query.code = context.code.toUpperCase();
  }

  // Add usage limit check
  query.$or = [
    { usageLimit: { $exists: false } },
    { $expr: { $lt: ['$currentUsage', '$usageLimit'] } }
  ];

  return this.find(query);
};

// Instance method to check if user can use this promotion
promotionSchema.methods.canUserUse = async function(userId: string) {
  if (!this.usageLimitPerUser) return true;
  
  const PromotionUsage = mongoose.model('PromotionUsage');
  const userUsageCount = await PromotionUsage.countDocuments({
    promotionId: this._id,
    userId: userId
  });
  
  return userUsageCount < this.usageLimitPerUser;
};

// Instance method to calculate discount amount
promotionSchema.methods.calculateDiscount = function(orderAmount: number, applicableAmount?: number) {
  const amount = applicableAmount || orderAmount;
  
  switch (this.type) {
    case 'percentage':
      let discount = (amount * this.value) / 100;
      if (this.maximumDiscountAmount) {
        discount = Math.min(discount, this.maximumDiscountAmount);
      }
      return discount;
    
    case 'fixed':
      return Math.min(this.value, amount);
    
    case 'free_shipping':
      return 0; // Shipping discount handled separately
    
    case 'buy_one_get_one':
      // BOGO logic would need more complex implementation
      return 0;
    
    default:
      return 0;
  }
};

const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);
const PromotionUsage = mongoose.model<IPromotionUsage>('PromotionUsage', promotionUsageSchema);

export { Promotion as default, PromotionUsage };
