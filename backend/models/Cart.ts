import mongoose, { Schema, Model } from 'mongoose';
import { ICart, ICartMethods, CartModel, ICartItem } from '../types/order';
import Product from './Product';

// Cart item subdocument schema
const cartItemSchema = new Schema<ICartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: Schema.Types.ObjectId
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Cart schema
const cartSchema = new Schema<ICart, Model<ICart>, ICartMethods>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    index: true
  },
  items: [cartItemSchema],
  
  // Calculated fields
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Expiration for guest carts
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure either userId or sessionId is present
cartSchema.pre('validate', function(next) {
  if (!this.userId && !this.sessionId) {
    next(new Error('Cart must have either userId or sessionId'));
  } else {
    next();
  }
});

// Instance methods
cartSchema.methods.addItem = async function(
  productId: mongoose.Types.ObjectId,
  quantity: number,
  variantId?: mongoose.Types.ObjectId
): Promise<void> {
  // Check if item already exists
  const existingItemIndex = this.items.findIndex((item: any) =>
    item.productId.equals(productId) &&
    (!variantId || (item.variantId && item.variantId.equals(variantId)))
  );

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    this.items[existingItemIndex]!.quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      productId,
      variantId: variantId || undefined,
      quantity,
      addedAt: new Date()
    } as any);
  }

  await this.calculateTotals();
};

cartSchema.methods.updateItem = async function(
  itemId: mongoose.Types.ObjectId,
  quantity: number
): Promise<void> {
  const item = this.items.find((item: any) => item._id.equals(itemId));
  if (!item) {
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    this.items = this.items.filter((item: any) => !item._id.equals(itemId));
  } else {
    item.quantity = quantity;
  }

  await this.calculateTotals();
};

cartSchema.methods.removeItem = async function(itemId: mongoose.Types.ObjectId): Promise<void> {
  this.items = this.items.filter((item: any) => !item._id.equals(itemId));
  await this.calculateTotals();
};

cartSchema.methods.clear = async function(): Promise<void> {
  this.items = [];
  this.subtotal = 0;
  this.totalItems = 0;
};

cartSchema.methods.calculateTotals = async function(): Promise<void> {
  let subtotal = 0;
  let totalItems = 0;

  // Get all product IDs to fetch prices
  const productIds = this.items.map((item: any) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();

  for (const item of this.items) {
    const product = products.find((p: any) => p._id.equals((item as any).productId));
    if (!product) continue;

    let itemPrice = (product as any).price;

    // Check if item has a variant with different price
    if ((item as any).variantId && (product as any).variants) {
      const variant = (product as any).variants.find((v: any) => v._id?.equals((item as any).variantId));
      if (variant && variant.price !== undefined) {
        itemPrice = variant.price;
      }
    }

    subtotal += itemPrice * (item as any).quantity;
    totalItems += (item as any).quantity;
  }

  this.subtotal = Math.round(subtotal * 100) / 100; // Round to 2 decimal places
  this.totalItems = totalItems;
};

cartSchema.methods.mergeCarts = async function(guestCart: ICart): Promise<void> {
  // Add all items from guest cart
  for (const guestItem of guestCart.items) {
    await this.addItem(guestItem.productId, guestItem.quantity, guestItem.variantId);
  }

  await this.calculateTotals();
};

// Pre-save middleware to calculate totals
cartSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    await this.calculateTotals();
  }
  next();
});

// Pre-save middleware to extend expiration for user carts
cartSchema.pre('save', function(next) {
  if (this.userId) {
    // User carts don't expire - remove the expiration
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
