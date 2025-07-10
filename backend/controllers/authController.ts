import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthService } from '@/services/authService';
import { EmailService } from '@/services/emailService';
import { JWTService } from '@/utils/jwt';
import { AuthenticatedRequest } from '@/types/common';
import { IRegisterRequest, ILoginRequest } from '@/types/user';
import { logger } from '@/utils/logger';

export const authController = {
  /**
   * Register a new user
   * @route POST /api/auth/register
   * @access Public
   */
  register: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userData: IRegisterRequest = req.body;

    const result = await AuthService.register(userData);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

  /**
   * Login user
   * @route POST /api/auth/login
   * @access Public
   */
  login: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const loginData: ILoginRequest = req.body;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip;

    const result = await AuthService.login(loginData, userAgent, ipAddress);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days or 7 days
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

  /**
   * Logout user
   * @route POST /api/auth/logout
   * @access Private
   */
  logout: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    const userId = req.user?._id;

    if (refreshToken && userId) {
      await AuthService.logout(userId.toString(), refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  }),

  /**
   * Logout from all devices
   * @route POST /api/auth/logout-all
   * @access Private
   */
  logoutAll: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    if (userId) {
      await AuthService.logoutAll(userId.toString());
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  }),

  /**
   * Refresh access token
   * @route POST /api/auth/refresh
   * @access Public
   */
  refreshToken: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
      return;
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

  /**
   * Send password reset email
   * @route POST /api/auth/forgot-password
   * @access Public
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    await AuthService.forgotPassword(email);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }),

  /**
   * Reset password using token
   * @route POST /api/auth/reset-password
   * @access Public
   */
  resetPassword: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token, password } = req.body;

    await AuthService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  }),

  /**
   * Verify email address
   * @route GET /api/auth/verify-email/:token
   * @access Public
   */
  verifyEmail: asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
      return;
    }

    await AuthService.verifyEmail(token);

    // Send welcome email
    // Note: In a real implementation, you might want to get user details to send welcome email

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to ShopSphere!'
    });
  }),

  /**
   * Resend email verification
   * @route POST /api/auth/resend-verification
   * @access Public
   */
  resendVerification: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    await AuthService.resendVerification(email);

    res.json({
      success: true,
      message: 'Verification email sent successfully.'
    });
  }),

  /**
   * Change password (for authenticated users)
   * @route POST /api/auth/change-password
   * @access Private
   */
  changePassword: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, password } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    await AuthService.changePassword(userId.toString(), currentPassword, password);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  }),

  /**
   * Get current user profile
   * @route GET /api/auth/me
   * @access Private
   */
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

  // OAuth placeholders - will be implemented when OAuth is set up
  googleAuth: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({
      success: false,
      message: 'Google OAuth not implemented yet'
    });
  }),

  googleCallback: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({
      success: false,
      message: 'Google OAuth callback not implemented yet'
    });
  }),

  facebookAuth: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({
      success: false,
      message: 'Facebook OAuth not implemented yet'
    });
  }),

  facebookCallback: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({
      success: false,
      message: 'Facebook OAuth callback not implemented yet'
    });
  })
};
