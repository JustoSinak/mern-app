import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, IProductMethods, ProductModel, IProductImage, IProductVariant, IProductReview, IProductSpecification } from '@/types/product';

// Product image subdocument schema
const productImageSchema = new Schema<IProductImage>({
  url: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  publicId: String // For Cloudinary
});

// Product variant subdocument schema
const productVariantSchema = new Schema<IProductVariant>({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  price: Number,
  inventory: {
    type: Number,
    required: true,
    min: 0
  },
  sku: String,
  isActive: {
    type: Boolean,
    default: true
  }
});

// Product review subdocument schema
const productReviewSchema = new Schema<IProductReview>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  images: [String],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Product specification subdocument schema
const productSpecificationSchema = new Schema<IProductSpecification>({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  group: String
});

// Product schema
const productSchema = new Schema<IProduct, Model<IProduct>, IProductMethods>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  
  // Inventory
  inventory: {
    type: Number,
    required: [true, 'Inventory is required'],
    min: [0, 'Inventory cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative']
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  allowBackorder: {
    type: Boolean,
    default: false
  },
  
  // Product details
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: String,
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  
  // Categorization
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: String,
  tags: [String],
  
  // Media
  images: [productImageSchema],
  videos: [String],
  
  // Variants
  variants: [productVariantSchema],
  hasVariants: {
    type: Boolean,
    default: false
  },
  
  // SEO
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  metaTitle: String,
  metaDescription: String,
  
  // Reviews and ratings
  reviews: [productReviewSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  
  // Product specifications
  specifications: [productSpecificationSchema],
  
  // Status and visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Shipping
  requiresShipping: {
    type: Boolean,
    default: true
  },
  shippingClass: String,
  
  // Digital products
  isDigital: {
    type: Boolean,
    default: false
  },
  downloadUrl: String,
  downloadLimit: Number,
  
  // Sales data
  totalSales: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  
  publishedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, isVisible: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ isFeatured: 1 });

// Virtual for stock status
productSchema.virtual('isInStock').get(function() {
  if (!this.trackInventory) return true;
  return this.inventory > 0 || this.allowBackorder;
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  if (!this.trackInventory) return false;
  return this.inventory <= this.lowStockThreshold;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        if (index > 0 && img.isPrimary) {
          img.isPrimary = false;
        }
      });
    }
  }
  next();
});

// Instance methods
productSchema.methods.updateAverageRating = async function(): Promise<void> {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    return;
  }

  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10;
  this.totalReviews = this.reviews.length;

  // Update rating distribution
  this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  this.reviews.forEach(review => {
    this.ratingDistribution[review.rating as keyof typeof this.ratingDistribution]++;
  });
};

productSchema.methods.addReview = async function(reviewData: any): Promise<void> {
  this.reviews.push({
    ...reviewData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await this.updateAverageRating();
};

productSchema.methods.updateInventory = async function(quantity: number, operation: 'add' | 'subtract'): Promise<void> {
  if (!this.trackInventory) return;

  if (operation === 'add') {
    this.inventory += quantity;
  } else {
    this.inventory = Math.max(0, this.inventory - quantity);
  }
};

productSchema.methods.isInStock = function(quantity: number = 1): boolean {
  if (!this.trackInventory) return true;
  return this.inventory >= quantity || this.allowBackorder;
};

productSchema.methods.getVariantBySku = function(sku: string): IProductVariant | undefined {
  return this.variants.find(variant => variant.sku === sku);
};

// Create and export the model
const Product = mongoose.model('Product', productSchema);

export default Product;
