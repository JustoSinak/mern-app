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
const addressSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        required: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
});
const orderItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    variantId: {
        type: mongoose_1.Schema.Types.ObjectId
    },
    variantName: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
});
const shippingMethodSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true,
        min: 0
    },
    estimatedDays: {
        type: Number,
        required: true,
        min: 1
    },
    trackingAvailable: {
        type: Boolean,
        default: false
    }
});
const paymentDetailsSchema = new mongoose_1.Schema({
    method: {
        type: String,
        enum: ['stripe', 'paypal', 'apple_pay', 'google_pay'],
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    paymentIntentId: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    paidAt: Date,
    refundedAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundedAt: Date
});
const orderTrackingSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: String
});
const orderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shippingAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shippingAddress: {
        type: addressSchema,
        required: true
    },
    billingAddress: {
        type: addressSchema,
        required: true
    },
    shippingMethod: {
        type: shippingMethodSchema,
        required: true
    },
    trackingNumber: String,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    paymentDetails: {
        type: paymentDetailsSchema,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    orderTracking: [orderTrackingSchema],
    customerNotes: String,
    internalNotes: String,
    couponCode: String,
    couponDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    returnRequested: {
        type: Boolean,
        default: false
    },
    returnReason: String,
    returnStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed']
    },
    returnRequestedAt: Date,
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
}, {
    timestamps: true
});
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });
orderSchema.pre('save', function (next) {
    if (!this.orderNumber) {
        this.orderNumber = this.generateOrderNumber();
    }
    next();
});
orderSchema.methods.calculateTotals = function () {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount - (this.couponDiscount || 0);
};
orderSchema.methods.addTrackingUpdate = function (status, message, location) {
    this.orderTracking.push({
        status,
        message,
        timestamp: new Date(),
        location: location || ''
    });
    this.status = status;
    switch (status) {
        case 'confirmed':
            this.confirmedAt = new Date();
            break;
        case 'shipped':
            this.shippedAt = new Date();
            break;
        case 'delivered':
            this.deliveredAt = new Date();
            break;
        case 'cancelled':
            this.cancelledAt = new Date();
            break;
    }
};
orderSchema.methods.canBeCancelled = function () {
    return ['pending', 'confirmed'].includes(this.status);
};
orderSchema.methods.canBeReturned = function () {
    if (this.status !== 'delivered')
        return false;
    if (this.returnRequested)
        return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.deliveredAt ? this.deliveredAt > thirtyDaysAgo : false;
};
orderSchema.methods.generateOrderNumber = function () {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-8)}-${random}`;
};
const Order = mongoose_1.default.model('Order', orderSchema);
exports.default = Order;
//# sourceMappingURL=Order.js.map