"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const productImageSchema = new mongoose_1.Schema({
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
    publicId: String
});
const productVariantSchema = new mongoose_1.Schema({
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
const productReviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const productSpecificationSchema = new mongoose_1.Schema({
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
const productSchema = new mongoose_1.Schema({
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
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    subcategory: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category'
    },
    brand: String,
    tags: [String],
    images: [productImageSchema],
    videos: [String],
    variants: [productVariantSchema],
    hasVariants: {
        type: Boolean,
        default: false
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    metaTitle: String,
    metaDescription: String,
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
    specifications: [productSpecificationSchema],
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
    requiresShipping: {
        type: Boolean,
        default: true
    },
    shippingClass: String,
    isDigital: {
        type: Boolean,
        default: false
    },
    downloadUrl: String,
    downloadLimit: Number,
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
productSchema.virtual('isInStock').get(function () {
    if (!this.trackInventory)
        return true;
    return this.inventory > 0 || this.allowBackorder;
});
productSchema.virtual('isLowStock').get(function () {
    if (!this.trackInventory)
        return false;
    return this.inventory <= this.lowStockThreshold;
});
productSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});
productSchema.pre('save', function (next) {
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
productSchema.methods.updateAverageRating = async function () {
    if (this.reviews.length === 0) {
        this.averageRating = 0;
        this.totalReviews = 0;
        this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        return;
    }
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(review => {
        this.ratingDistribution[review.rating]++;
    });
};
productSchema.methods.addReview = async function (reviewData) {
    this.reviews.push({
        ...reviewData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    await this.updateAverageRating();
};
productSchema.methods.updateInventory = async function (quantity, operation) {
    if (!this.trackInventory)
        return;
    if (operation === 'add') {
        this.inventory += quantity;
    }
    else {
        this.inventory = Math.max(0, this.inventory - quantity);
    }
};
productSchema.methods.isInStock = function (quantity = 1) {
    if (!this.trackInventory)
        return true;
    return this.inventory >= quantity || this.allowBackorder;
};
productSchema.methods.getVariantBySku = function (sku) {
    return this.variants.find(variant => variant.sku === sku);
};
const Product = mongoose_1.default.model('Product', productSchema);
exports.default = Product;
//# sourceMappingURL=Product.js.map