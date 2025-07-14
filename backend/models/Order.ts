import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, IOrderMethods, OrderModel, IOrderItem, IShippingMethod, IPaymentDetails, IOrderTracking } from '../types/order';
import { IAddress } from '../types/user';

// Address schema (reused from User model)
const addressSchema = new Schema<IAddress>({
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

// Order item subdocument schema
const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId
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

// Shipping method subdocument schema
const shippingMethodSchema = new Schema<IShippingMethod>({
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

// Payment details subdocument schema
const paymentDetailsSchema = new Schema<IPaymentDetails>({
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

// Order tracking subdocument schema
const orderTrackingSchema = new Schema<IOrderTracking>({
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

// Order schema
const orderSchema = new Schema<IOrder, Model<IOrder>, IOrderMethods>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order items
  items: [orderItemSchema],
  
  // Pricing
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
  
  // Addresses
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  billingAddress: {
    type: addressSchema,
    required: true
  },
  
  // Shipping
  shippingMethod: {
    type: shippingMethodSchema,
    required: true
  },
  trackingNumber: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Payment
  paymentDetails: {
    type: paymentDetailsSchema,
    required: true
  },
  
  // Status and tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  orderTracking: [orderTrackingSchema],
  
  // Customer notes
  customerNotes: String,
  internalNotes: String,
  
  // Discounts and coupons
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Return/refund information
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
  
  // Timestamps
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = this.generateOrderNumber();
  }
  next();
});

// Instance methods
orderSchema.methods.calculateTotals = function(): void {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount - (this.couponDiscount || 0);
};

orderSchema.methods.addTrackingUpdate = function(
  status: IOrderTracking['status'],
  message: string,
  location?: string
): void {
  this.orderTracking.push({
    status,
    message,
    timestamp: new Date(),
    location: location || ''
  });
  
  this.status = status;
  
  // Update relevant timestamps
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

orderSchema.methods.canBeCancelled = function(): boolean {
  return ['pending', 'confirmed'].includes(this.status);
};

orderSchema.methods.canBeReturned = function(): boolean {
  if (this.status !== 'delivered') return false;
  if (this.returnRequested) return false;
  
  // Allow returns within 30 days of delivery
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deliveredAt ? this.deliveredAt > thirtyDaysAgo : false;
};

orderSchema.methods.generateOrderNumber = function(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-8)}-${random}`;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
