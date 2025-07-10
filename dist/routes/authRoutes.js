"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("@/controllers/authController");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
router.post('/register', validation_1.validateAuth.register, authController_1.authController.register);
router.post('/login', validation_1.validateAuth.login, authController_1.authController.login);
router.post('/logout', auth_1.auth, authController_1.authController.logout);
router.post('/logout-all', auth_1.auth, authController_1.authController.logoutAll);
router.post('/refresh', authController_1.authController.refreshToken);
router.post('/forgot-password', validation_1.validateAuth.forgotPassword, authController_1.authController.forgotPassword);
router.post('/reset-password', validation_1.validateAuth.resetPassword, authController_1.authController.resetPassword);
router.get('/verify-email/:token', validation_1.validateAuth.verifyEmail, authController_1.authController.verifyEmail);
router.post('/resend-verification', validation_1.validateAuth.forgotPassword, authController_1.authController.resendVerification);
router.post('/change-password', auth_1.auth, validation_1.validateAuth.changePassword, authController_1.authController.changePassword);
router.get('/me', auth_1.auth, authController_1.authController.getProfile);
router.get('/google', authController_1.authController.googleAuth);
router.get('/google/callback', authController_1.authController.googleCallback);
router.get('/facebook', authController_1.authController.facebookAuth);
router.get('/facebook/callback', authController_1.authController.facebookCallback);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map