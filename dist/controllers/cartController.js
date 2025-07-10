"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const cartService_1 = require("@/services/cartService");
exports.cartController = {
    getCart: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userId = req.user?._id?.toString();
        const sessionId = req.sessionID || req.headers['x-session-id'];
        const cart = await cartService_1.CartService.getCart(userId, sessionId);
        res.json({
            success: true,
            data: cart
        });
    }),
    addItem: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { productId, quantity, variantId } = req.body;
        const userId = req.user?._id?.toString();
        const sessionId = req.sessionID || req.headers['x-session-id'];
        const cart = await cartService_1.CartService.addItem(productId, quantity, variantId, userId, sessionId);
        res.status(201).json({
            success: true,
            message: 'Item added to cart successfully',
            data: cart
        });
    }),
    updateItem: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user?._id?.toString();
        const sessionId = req.sessionID || req.headers['x-session-id'];
        if (!itemId) {
            res.status(400).json({
                success: false,
                message: 'Item ID is required'
            });
            return;
        }
        const cart = await cartService_1.CartService.updateItem(itemId, quantity, userId, sessionId);
        res.json({
            success: true,
            message: 'Cart item updated successfully',
            data: cart
        });
    }),
    removeItem: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { itemId } = req.params;
        const userId = req.user?._id?.toString();
        const sessionId = req.sessionID || req.headers['x-session-id'];
        if (!itemId) {
            res.status(400).json({
                success: false,
                message: 'Item ID is required'
            });
            return;
        }
        const cart = await cartService_1.CartService.removeItem(itemId, userId, sessionId);
        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            data: cart
        });
    }),
    clearCart: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userId = req.user?._id?.toString();
        const sessionId = req.sessionID || req.headers['x-session-id'];
        const cart = await cartService_1.CartService.clearCart(userId, sessionId);
        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        });
    }),
    mergeCart: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userId = req.user?._id?.toString();
        const { sessionId } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const cart = await cartService_1.CartService.mergeCart(userId, sessionId);
        res.json({
            success: true,
            message: 'Carts merged successfully',
            data: cart
        });
    }),
    getCartSummary: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userId = req.user?._id?.toString();
        const sessionId = req.sessionID || req.headers['x-session-id'];
        const summary = await cartService_1.CartService.getCartSummary(userId, sessionId);
        res.json({
            success: true,
            data: summary
        });
    })
};
//# sourceMappingURL=cartController.js.map