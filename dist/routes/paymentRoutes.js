"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("@/controllers/paymentController");
const auth_1 = require("@/middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.post('/create-intent', auth_1.auth, [
    (0, express_validator_1.body)('orderId').isMongoId().withMessage('Valid order ID is required'),
    (0, express_validator_1.body)('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('currency').optional().isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
    validation_1.handleValidationErrors
], paymentController_1.paymentController.createPaymentIntent);
router.post('/confirm', auth_1.auth, [
    (0, express_validator_1.body)('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    validation_1.handleValidationErrors
], paymentController_1.paymentController.confirmPayment);
router.post('/refund', auth_1.auth, auth_1.adminAuth, [
    (0, express_validator_1.body)('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    (0, express_validator_1.body)('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
    (0, express_validator_1.body)('reason').optional().isString().withMessage('Reason must be a string'),
    validation_1.handleValidationErrors
], paymentController_1.paymentController.processRefund);
router.get('/status/:paymentIntentId', auth_1.auth, [
    (0, express_validator_1.param)('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    validation_1.handleValidationErrors
], paymentController_1.paymentController.getPaymentStatus);
router.get('/methods', auth_1.auth, paymentController_1.paymentController.getPaymentMethods);
router.post('/setup-intent', auth_1.auth, paymentController_1.paymentController.createSetupIntent);
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), paymentController_1.paymentController.handleWebhook);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map