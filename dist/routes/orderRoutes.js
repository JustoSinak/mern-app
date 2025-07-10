"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("@/controllers/orderController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.post('/', auth_1.auth, validation_1.validateOrder.create, orderController_1.orderController.createOrder);
router.get('/', auth_1.auth, orderController_1.orderController.getUserOrders);
router.get('/all', auth_1.auth, auth_1.adminAuth, orderController_1.orderController.getAllOrders);
router.get('/:id', auth_1.auth, orderController_1.orderController.getOrder);
router.put('/:id/status', auth_1.auth, auth_1.adminAuth, validation_1.validateOrder.updateStatus, orderController_1.orderController.updateOrderStatus);
router.post('/:id/cancel', auth_1.auth, orderController_1.orderController.cancelOrder);
router.post('/:id/refund', auth_1.auth, auth_1.adminAuth, validation_1.validateOrder.refund, orderController_1.orderController.processRefund);
router.get('/:id/tracking', auth_1.auth, orderController_1.orderController.getOrderTracking);
router.post('/:id/return', auth_1.auth, validation_1.validateOrder.return, orderController_1.orderController.requestReturn);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map