"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const authService_1 = require("@/services/authService");
exports.authController = {
    register: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userData = req.body;
        const result = await authService_1.AuthService.register(userData);
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            data: {
                user: {
                    _id: result.user._id,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    email: result.user.email,
                    role: result.user.role,
                    isEmailVerified: result.user.isEmailVerified
                },
                accessToken: result.tokens.accessToken,
                expiresIn: result.tokens.expiresIn
            }
        });
    }),
    login: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const loginData = req.body;
        const userAgent = req.get('User-Agent');
        const ipAddress = req.ip;
        const result = await authService_1.AuthService.login(loginData, userAgent, ipAddress);
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: result.user._id,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    email: result.user.email,
                    role: result.user.role,
                    isEmailVerified: result.user.isEmailVerified,
                    lastLogin: result.user.lastLogin
                },
                accessToken: result.tokens.accessToken,
                expiresIn: result.tokens.expiresIn
            }
        });
    }),
    logout: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const refreshToken = req.cookies.refreshToken;
        const userId = req.user?._id;
        if (refreshToken && userId) {
            await authService_1.AuthService.logout(userId.toString(), refreshToken);
        }
        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }),
    logoutAll: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const userId = req.user?._id;
        if (userId) {
            await authService_1.AuthService.logoutAll(userId.toString());
        }
        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    }),
    refreshToken: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: 'Refresh token not provided'
            });
            return;
        }
        const tokens = await authService_1.AuthService.refreshToken(refreshToken);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn
            }
        });
    }),
    forgotPassword: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { email } = req.body;
        await authService_1.AuthService.forgotPassword(email);
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }),
    resetPassword: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { token, password } = req.body;
        await authService_1.AuthService.resetPassword(token, password);
        res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    }),
    verifyEmail: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { token } = req.params;
        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
            return;
        }
        await authService_1.AuthService.verifyEmail(token);
        res.json({
            success: true,
            message: 'Email verified successfully. Welcome to ShopSphere!'
        });
    }),
    resendVerification: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { email } = req.body;
        await authService_1.AuthService.resendVerification(email);
        res.json({
            success: true,
            message: 'Verification email sent successfully.'
        });
    }),
    changePassword: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { currentPassword, password } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        await authService_1.AuthService.changePassword(userId.toString(), currentPassword, password);
        res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });
    }),
    getProfile: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    avatar: user.avatar,
                    addresses: user.addresses,
                    preferences: user.preferences,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            }
        });
    }),
    googleAuth: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Google OAuth not implemented yet'
        });
    }),
    googleCallback: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Google OAuth callback not implemented yet'
        });
    }),
    facebookAuth: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Facebook OAuth not implemented yet'
        });
    }),
    facebookCallback: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Facebook OAuth callback not implemented yet'
        });
    })
};
//# sourceMappingURL=authController.js.map