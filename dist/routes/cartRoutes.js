"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cartController_1 = require("@/controllers/cartController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.get('/', auth_1.auth, cartController_1.cartController.getCart);
router.post('/items', auth_1.auth, validation_1.validateCart.addItem, cartController_1.cartController.addItem);
router.put('/items/:itemId', auth_1.auth, validation_1.validateCart.updateItem, cartController_1.cartController.updateItem);
router.delete('/items/:itemId', auth_1.auth, cartController_1.cartController.removeItem);
router.delete('/', auth_1.auth, cartController_1.cartController.clearCart);
router.post('/merge', auth_1.auth, validation_1.validateCart.merge, cartController_1.cartController.mergeCart);
router.get('/summary', auth_1.auth, cartController_1.cartController.getCartSummary);
exports.default = router;
//# sourceMappingURL=cartRoutes.js.map