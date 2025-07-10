"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
exports.userController = {
    getProfile: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Get profile endpoint not implemented yet'
        });
    }),
    updateProfile: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Update profile endpoint not implemented yet'
        });
    }),
    deleteAccount: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Delete account endpoint not implemented yet'
        });
    }),
    getUserOrders: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Get user orders endpoint not implemented yet'
        });
    }),
    getWishlist: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Get wishlist endpoint not implemented yet'
        });
    }),
    addToWishlist: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Add to wishlist endpoint not implemented yet'
        });
    }),
    removeFromWishlist: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Remove from wishlist endpoint not implemented yet'
        });
    }),
    getAddresses: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Get addresses endpoint not implemented yet'
        });
    }),
    addAddress: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Add address endpoint not implemented yet'
        });
    }),
    updateAddress: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Update address endpoint not implemented yet'
        });
    }),
    deleteAddress: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Delete address endpoint not implemented yet'
        });
    })
};
//# sourceMappingURL=userController.js.map