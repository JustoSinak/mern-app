"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const models_1 = require("@/models");
const jwt_1 = require("@/utils/jwt");
const password_1 = require("@/utils/password");
const emailService_1 = require("./emailService");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
class AuthService {
    static async register(userData) {
        try {
            const existingUser = await models_1.User.findOne({ email: userData.email });
            if (existingUser) {
                throw new errorHandler_1.AppError('User with this email already exists', 400);
            }
            const user = new models_1.User({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                phone: userData.phone
            });
            const verificationToken = user.generateEmailVerificationToken();
            await user.save();
            await emailService_1.EmailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
            const tokens = jwt_1.JWTService.generateTokenPair(user._id.toString(), user.email, user.role);
            user.addRefreshToken(tokens.refreshToken);
            await user.save();
            logger_1.logger.info(`New user registered: ${user.email}`);
            return {
                user,
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            throw error;
        }
    }
    static async login(loginData, userAgent, ipAddress) {
        try {
            const user = await models_1.User.findOne({ email: loginData.email }).select('+password');
            if (!user) {
                throw new errorHandler_1.AppError('Invalid email or password', 401);
            }
            if (user.isLocked()) {
                throw new errorHandler_1.AppError('Account is temporarily locked due to too many failed login attempts', 423);
            }
            if (!user.isActive) {
                throw new errorHandler_1.AppError('Account is deactivated', 401);
            }
            const isPasswordValid = await user.comparePassword(loginData.password);
            if (!isPasswordValid) {
                await user.incLoginAttempts();
                throw new errorHandler_1.AppError('Invalid email or password', 401);
            }
            await user.resetLoginAttempts();
            user.lastLogin = new Date();
            const tokens = jwt_1.JWTService.generateTokenPair(user._id.toString(), user.email, user.role);
            user.addRefreshToken(tokens.refreshToken, userAgent, ipAddress);
            await user.save();
            logger_1.logger.info(`User logged in: ${user.email}`);
            return {
                user,
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            throw error;
        }
    }
    static async refreshToken(refreshToken) {
        try {
            const decoded = jwt_1.JWTService.verifyRefreshToken(refreshToken);
            const user = await models_1.User.findById(decoded.userId);
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
            if (!tokenExists) {
                throw new errorHandler_1.AppError('Invalid refresh token', 401);
            }
            if (!user.isActive) {
                throw new errorHandler_1.AppError('Account is deactivated', 401);
            }
            user.removeRefreshToken(refreshToken);
            const tokens = jwt_1.JWTService.generateTokenPair(user._id.toString(), user.email, user.role);
            user.addRefreshToken(tokens.refreshToken);
            await user.save();
            return tokens;
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            throw error;
        }
    }
    static async logout(userId, refreshToken) {
        try {
            const user = await models_1.User.findById(userId);
            if (user) {
                user.removeRefreshToken(refreshToken);
                await user.save();
            }
            logger_1.logger.info(`User logged out: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            throw error;
        }
    }
    static async logoutAll(userId) {
        try {
            const user = await models_1.User.findById(userId);
            if (user) {
                user.refreshTokens = [];
                await user.save();
            }
            logger_1.logger.info(`User logged out from all devices: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Logout all error:', error);
            throw error;
        }
    }
    static async forgotPassword(email) {
        try {
            const user = await models_1.User.findOne({ email });
            if (!user) {
                return;
            }
            const resetToken = user.generatePasswordResetToken();
            await user.save();
            await emailService_1.EmailService.sendPasswordResetEmail(email, resetToken, user.firstName);
            logger_1.logger.info(`Password reset email sent to: ${email}`);
        }
        catch (error) {
            logger_1.logger.error('Forgot password error:', error);
            throw error;
        }
    }
    static async resetPassword(token, newPassword) {
        try {
            const hashedToken = password_1.PasswordService.hashResetToken(token);
            const user = await models_1.User.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() }
            });
            if (!user) {
                throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
            }
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.refreshTokens = [];
            await user.save();
            logger_1.logger.info(`Password reset successful for user: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Reset password error:', error);
            throw error;
        }
    }
    static async verifyEmail(token) {
        try {
            const hashedToken = password_1.PasswordService.hashVerificationToken(token);
            const user = await models_1.User.findOne({
                emailVerificationToken: hashedToken,
                emailVerificationExpires: { $gt: Date.now() }
            });
            if (!user) {
                throw new errorHandler_1.AppError('Invalid or expired verification token', 400);
            }
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();
            logger_1.logger.info(`Email verified for user: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Email verification error:', error);
            throw error;
        }
    }
    static async resendVerification(email) {
        try {
            const user = await models_1.User.findOne({ email });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            if (user.isEmailVerified) {
                throw new errorHandler_1.AppError('Email is already verified', 400);
            }
            const verificationToken = user.generateEmailVerificationToken();
            await user.save();
            await emailService_1.EmailService.sendVerificationEmail(email, verificationToken, user.firstName);
            logger_1.logger.info(`Verification email resent to: ${email}`);
        }
        catch (error) {
            logger_1.logger.error('Resend verification error:', error);
            throw error;
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await models_1.User.findById(userId).select('+password');
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                throw new errorHandler_1.AppError('Current password is incorrect', 400);
            }
            user.password = newPassword;
            user.refreshTokens = [];
            await user.save();
            logger_1.logger.info(`Password changed for user: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map