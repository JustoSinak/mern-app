"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const models_1 = require("@/models");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const mongoose_1 = require("mongoose");
class CartService {
    static async getCart(userId, sessionId) {
        try {
            if (!userId && !sessionId) {
                throw new errorHandler_1.AppError('User ID or session ID required', 400);
            }
            const filter = userId ? { userId } : { sessionId };
            let cart = await models_1.Cart.findOne(filter)
                .populate({
                path: 'items.productId',
                select: 'name price images inventory trackInventory allowBackorder status isVisible'
            })
                .populate({
                path: 'items.variantId'
            });
            if (!cart) {
                cart = new models_1.Cart(filter);
                await cart.save();
            }
            const validItems = cart.items.filter((item) => {
                const product = item.productId;
                return product && product.status === 'active' && product.isVisible;
            });
            if (validItems.length !== cart.items.length) {
                cart.items = validItems;
                await cart.calculateTotals();
                await cart.save();
            }
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error getting cart:', error);
            throw error;
        }
    }
    static async addItem(productId, quantity, variantId, userId, sessionId) {
        try {
            if (!userId && !sessionId) {
                throw new errorHandler_1.AppError('User ID or session ID required', 400);
            }
            const product = await models_1.Product.findById(productId);
            if (!product) {
                throw new errorHandler_1.AppError('Product not found', 404);
            }
            if (product.status !== 'active' || !product.isVisible) {
                throw new errorHandler_1.AppError('Product is not available', 400);
            }
            if (product.trackInventory && !product.allowBackorder) {
                if (product.inventory < quantity) {
                    throw new errorHandler_1.AppError(`Only ${product.inventory} items available in stock`, 400);
                }
            }
            const cart = await this.getCart(userId, sessionId);
            await cart.addItem(new mongoose_1.Types.ObjectId(productId), quantity, variantId ? new mongoose_1.Types.ObjectId(variantId) : undefined);
            await cart.save();
            return await this.getCart(userId, sessionId);
        }
        catch (error) {
            logger_1.logger.error('Error adding item to cart:', error);
            throw error;
        }
    }
    static async updateItem(itemId, quantity, userId, sessionId) {
        try {
            const cart = await this.getCart(userId, sessionId);
            await cart.updateItem(new mongoose_1.Types.ObjectId(itemId), quantity);
            await cart.save();
            return await this.getCart(userId, sessionId);
        }
        catch (error) {
            logger_1.logger.error('Error updating cart item:', error);
            throw error;
        }
    }
    static async removeItem(itemId, userId, sessionId) {
        try {
            const cart = await this.getCart(userId, sessionId);
            await cart.removeItem(new mongoose_1.Types.ObjectId(itemId));
            await cart.save();
            return await this.getCart(userId, sessionId);
        }
        catch (error) {
            logger_1.logger.error('Error removing cart item:', error);
            throw error;
        }
    }
    static async clearCart(userId, sessionId) {
        try {
            const cart = await this.getCart(userId, sessionId);
            await cart.clear();
            await cart.save();
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error clearing cart:', error);
            throw error;
        }
    }
    static async mergeCart(userId, guestSessionId) {
        try {
            const [userCart, guestCart] = await Promise.all([
                this.getCart(userId),
                this.getCart(undefined, guestSessionId)
            ]);
            if (!guestCart || guestCart.items.length === 0) {
                return userCart;
            }
            await userCart.mergeCarts(guestCart);
            await userCart.save();
            await models_1.Cart.findByIdAndDelete(guestCart._id);
            return userCart;
        }
        catch (error) {
            logger_1.logger.error('Error merging carts:', error);
            throw error;
        }
    }
    static async getCartSummary(userId, sessionId) {
        try {
            const cart = await this.getCart(userId, sessionId);
            return {
                totalItems: cart.totalItems,
                subtotal: cart.subtotal,
                itemCount: cart.items.length
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting cart summary:', error);
            throw error;
        }
    }
    static async validateCartForCheckout(userId, sessionId) {
        try {
            const cart = await this.getCart(userId, sessionId);
            if (cart.items.length === 0) {
                throw new errorHandler_1.AppError('Cart is empty', 400);
            }
            const validationErrors = [];
            for (const item of cart.items) {
                const product = item.productId;
                if (!product || product.status !== 'active' || !product.isVisible) {
                    validationErrors.push(`Product "${product?.name || 'Unknown'}" is no longer available`);
                    continue;
                }
                if (product.trackInventory && !product.allowBackorder) {
                    if (product.inventory < item.quantity) {
                        validationErrors.push(`Only ${product.inventory} items of "${product.name}" available in stock`);
                    }
                }
            }
            if (validationErrors.length > 0) {
                throw new errorHandler_1.AppError(`Cart validation failed: ${validationErrors.join(', ')}`, 400);
            }
            return {
                valid: true,
                cart,
                summary: {
                    totalItems: cart.totalItems,
                    subtotal: cart.subtotal,
                    itemCount: cart.items.length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error validating cart:', error);
            throw error;
        }
    }
    static async reserveInventory(cartId) {
        try {
            const cart = await models_1.Cart.findById(cartId).populate('items.productId');
            if (!cart) {
                throw new errorHandler_1.AppError('Cart not found', 404);
            }
            const reservations = [];
            for (const item of cart.items) {
                const product = item.productId;
                const quantity = item.quantity;
                if (product.trackInventory && !product.allowBackorder) {
                    const updatedProduct = await models_1.Product.findByIdAndUpdate(product._id, { $inc: { inventory: -quantity } }, { new: true });
                    if (!updatedProduct || updatedProduct.inventory < 0) {
                        for (const reservation of reservations) {
                            await models_1.Product.findByIdAndUpdate(reservation.productId, { $inc: { inventory: reservation.quantity } });
                        }
                        throw new errorHandler_1.AppError(`Insufficient inventory for ${product.name}`, 400);
                    }
                    reservations.push({
                        productId: product._id,
                        quantity
                    });
                }
            }
            return reservations;
        }
        catch (error) {
            logger_1.logger.error('Error reserving inventory:', error);
            throw error;
        }
    }
    static async releaseInventory(reservations) {
        try {
            for (const reservation of reservations) {
                await models_1.Product.findByIdAndUpdate(reservation.productId, { $inc: { inventory: reservation.quantity } });
            }
        }
        catch (error) {
            logger_1.logger.error('Error releasing inventory:', error);
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=cartService.js.map