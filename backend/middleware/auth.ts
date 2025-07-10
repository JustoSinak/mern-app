import { Request, Response, NextFunction } from 'express';
import { AppError, asyncHandler } from './errorHandler';
import { JWTService } from '@/utils/jwt';
import { User } from '@/models';
import { AuthenticatedRequest } from '@/types/common';
import { logger } from '@/utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const auth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AppError('Access denied. No token provided', 401);
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      throw new AppError('Token is valid but user not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    if (user.isLocked()) {
      throw new AppError('Account is temporarily locked', 401);
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Authentication error:', error);
      next(new AppError('Invalid token', 401));
    }
  }
});

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = JWTService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');

      if (user && user.isActive && !user.isLocked()) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error);
    next();
  }
});

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Admin authorization middleware
 */
export const adminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Access denied. Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin privileges required', 403));
  }

  next();
};

/**
 * Moderator or Admin authorization middleware
 */
export const moderatorAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Access denied. Authentication required', 401));
  }

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return next(new AppError('Access denied. Moderator privileges required', 403));
  }

  next();
};

/**
 * Owner or Admin authorization middleware
 * Checks if user owns the resource or is admin
 */
export const ownerOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. Authentication required', 401));
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (req.user._id.toString() !== resourceUserId) {
      return next(new AppError('Access denied. You can only access your own resources', 403));
    }

    next();
  };
};
