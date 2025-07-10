"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("@/controllers/userController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.get('/profile', auth_1.auth, userController_1.userController.getProfile);
router.put('/profile', auth_1.auth, validation_1.validateUser.updateProfile, userController_1.userController.updateProfile);
router.delete('/profile', auth_1.auth, userController_1.userController.deleteAccount);
router.get('/orders', auth_1.auth, userController_1.userController.getUserOrders);
router.get('/wishlist', auth_1.auth, userController_1.userController.getWishlist);
router.post('/wishlist/:productId', auth_1.auth, userController_1.userController.addToWishlist);
router.delete('/wishlist/:productId', auth_1.auth, userController_1.userController.removeFromWishlist);
router.get('/addresses', auth_1.auth, userController_1.userController.getAddresses);
router.post('/addresses', auth_1.auth, validation_1.validateUser.address, userController_1.userController.addAddress);
router.put('/addresses/:addressId', auth_1.auth, validation_1.validateUser.address, userController_1.userController.updateAddress);
router.delete('/addresses/:addressId', auth_1.auth, userController_1.userController.deleteAddress);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map