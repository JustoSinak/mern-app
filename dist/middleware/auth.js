"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerOrAdmin = exports.moderatorAuth = exports.adminAuth = exports.authorize = exports.optionalAuth = exports.auth = void 0;
const errorHandler_1 = require("./errorHandler");
const jwt_1 = require("@/utils/jwt");
const models_1 = require("@/models");
const logger_1 = require("@/utils/logger");
exports.auth = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = jwt_1.JWTService.extractTokenFromHeader(authHeader);
        if (!token) {
            throw new errorHandler_1.AppError('Access denied. No token provided', 401);
        }
        const decoded = jwt_1.JWTService.verifyAccessToken(token);
        const user = await models_1.User.findById(decoded.userId).select('-password -refreshTokens');
        if (!user) {
            throw new errorHandler_1.AppError('Token is valid but user not found', 401);
        }
        if (!user.isActive) {
            throw new errorHandler_1.AppError('Account is deactivated', 401);
        }
        if (user.isLocked()) {
            throw new errorHandler_1.AppError('Account is temporarily locked', 401);
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            next(error);
        }
        else {
            logger_1.logger.error('Authentication error:', error);
            next(new errorHandler_1.AppError('Invalid token', 401));
        }
    }
});
exports.optionalAuth = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = jwt_1.JWTService.extractTokenFromHeader(authHeader);
        if (token) {
            const decoded = jwt_1.JWTService.verifyAccessToken(token);
            const user = await models_1.User.findById(decoded.userId).select('-password -refreshTokens');
            if (user && user.isActive && !user.isLocked()) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.debug('Optional auth failed:', error);
        next();
    }
});
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Access denied. Authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('Access denied. Insufficient permissions', 403));
        }
        next();
    };
};
exports.authorize = authorize;
const adminAuth = (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Access denied. Authentication required', 401));
    }
    if (req.user.role !== 'admin') {
        return next(new errorHandler_1.AppError('Access denied. Admin privileges required', 403));
    }
    next();
};
exports.adminAuth = adminAuth;
const moderatorAuth = (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Access denied. Authentication required', 401));
    }
    if (!['admin', 'moderator'].includes(req.user.role)) {
        return next(new errorHandler_1.AppError('Access denied. Moderator privileges required', 403));
    }
    next();
};
exports.moderatorAuth = moderatorAuth;
const ownerOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Access denied. Authentication required', 401));
        }
        if (req.user.role === 'admin') {
            return next();
        }
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        if (req.user._id.toString() !== resourceUserId) {
            return next(new errorHandler_1.AppError('Access denied. You can only access your own resources', 403));
        }
        next();
    };
};
exports.ownerOrAdmin = ownerOrAdmin;
//# sourceMappingURL=auth.js.map