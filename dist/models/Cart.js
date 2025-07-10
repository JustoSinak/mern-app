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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const Product_1 = __importDefault(require("./Product"));
const cartItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose_1.Schema.Types.ObjectId
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
const cartSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    sessionId: {
        type: String,
        index: true
    },
    items: [cartItemSchema],
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
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        index: { expireAfterSeconds: 0 }
    }
}, {
    timestamps: true
});
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.pre('validate', function (next) {
    if (!this.userId && !this.sessionId) {
        next(new Error('Cart must have either userId or sessionId'));
    }
    else {
        next();
    }
});
cartSchema.methods.addItem = async function (productId, quantity, variantId) {
    const existingItemIndex = this.items.findIndex((item) => item.productId.equals(productId) &&
        (!variantId || (item.variantId && item.variantId.equals(variantId))));
    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += quantity;
    }
    else {
        this.items.push({
            productId,
            variantId: variantId || undefined,
            quantity,
            addedAt: new Date()
        });
    }
    await this.calculateTotals();
};
cartSchema.methods.updateItem = async function (itemId, quantity) {
    const item = this.items.find((item) => item._id.equals(itemId));
    if (!item) {
        throw new Error('Cart item not found');
    }
    if (quantity <= 0) {
        this.items = this.items.filter((item) => !item._id.equals(itemId));
    }
    else {
        item.quantity = quantity;
    }
    await this.calculateTotals();
};
cartSchema.methods.removeItem = async function (itemId) {
    this.items = this.items.filter((item) => !item._id.equals(itemId));
    await this.calculateTotals();
};
cartSchema.methods.clear = async function () {
    this.items = [];
    this.subtotal = 0;
    this.totalItems = 0;
};
cartSchema.methods.calculateTotals = async function () {
    let subtotal = 0;
    let totalItems = 0;
    const productIds = this.items.map((item) => item.productId);
    const products = await Product_1.default.find({ _id: { $in: productIds } }).lean();
    for (const item of this.items) {
        const product = products.find((p) => p._id.equals(item.productId));
        if (!product)
            continue;
        let itemPrice = product.price;
        if (item.variantId && product.variants) {
            const variant = product.variants.find((v) => v._id?.equals(item.variantId));
            if (variant && variant.price !== undefined) {
                itemPrice = variant.price;
            }
        }
        subtotal += itemPrice * item.quantity;
        totalItems += item.quantity;
    }
    this.subtotal = Math.round(subtotal * 100) / 100;
    this.totalItems = totalItems;
};
cartSchema.methods.mergeCarts = async function (guestCart) {
    for (const guestItem of guestCart.items) {
        await this.addItem(guestItem.productId, guestItem.quantity, guestItem.variantId);
    }
    await this.calculateTotals();
};
cartSchema.pre('save', async function (next) {
    if (this.isModified('items')) {
        await this.calculateTotals();
    }
    next();
});
cartSchema.pre('save', function (next) {
    if (this.userId) {
        this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    next();
});
const Cart = mongoose_1.default.model('Cart', cartSchema);
exports.default = Cart;
//# sourceMappingURL=Cart.js.map