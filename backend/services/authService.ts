import crypto from 'crypto';
import { User } from '../models';
import { JWTService } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { EmailService } from './emailService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { IRegisterRequest, ILoginRequest, IUser } from '../types/user';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData: IRegisterRequest): Promise<{
    user: IUser;
    tokens: { accessToken: string; refreshToken: string; expiresIn: string };
  }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Create new user
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      
      // Save user
      await user.save();

      // Send verification email
      await EmailService.sendVerificationEmail(user.email, verificationToken, user.firstName);

      // Generate tokens
      const tokens = JWTService.generateTokenPair(
        user._id.toString(),
        user.email,
        user.role
      );

      // Add refresh token to user
      user.addRefreshToken(tokens.refreshToken);
      await user.save();

      logger.info(`New user registered: ${user.email}`);

      return {
        user,
        tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(
    loginData: ILoginRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: IUser;
    tokens: { accessToken: string; refreshToken: string; expiresIn: string };
  }> {
    try {
      // Find user by email and include password
      const user = await User.findOne({ email: loginData.email }).select('+password');
      
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw new AppError('Account is temporarily locked due to too many failed login attempts', 423);
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(loginData.password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        throw new AppError('Invalid email or password', 401);
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      user.lastLogin = new Date();

      // Generate tokens
      const tokens = JWTService.generateTokenPair(
        user._id.toString(),
        user.email,
        user.role
      );

      // Add refresh token to user
      user.addRefreshToken(tokens.refreshToken, userAgent, ipAddress);
      await user.save();

      logger.info(`User logged in: ${user.email}`);

      return {
        user,
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }> {
    try {
      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
      if (!tokenExists) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
      }

      // Remove old refresh token
      user.removeRefreshToken(refreshToken);

      // Generate new tokens
      const tokens = JWTService.generateTokenPair(
        user._id.toString(),
        user.email,
        user.role
      );

      // Add new refresh token
      user.addRefreshToken(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user (remove refresh token)
   */
  static async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.removeRefreshToken(refreshToken);
        await user.save();
      }
      
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      
      logger.info(`User logged out from all devices: ${userId}`);
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not
        return;
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send reset email
      await EmailService.sendPasswordResetEmail(email, resetToken, user.firstName);
      
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = PasswordService.hashResetToken(token);

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      
      // Clear all refresh tokens for security
      user.refreshTokens = [];
      
      await user.save();
      
      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = PasswordService.hashVerificationToken(token);

      // Find user with valid verification token
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new AppError('Invalid or expired verification token', 400);
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      await user.save();
      
      logger.info(`Email verified for user: ${user.email}`);
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  static async resendVerification(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isEmailVerified) {
        throw new AppError('Email is already verified', 400);
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await EmailService.sendVerificationEmail(email, verificationToken, user.firstName);
      
      logger.info(`Verification email resent to: ${email}`);
    } catch (error) {
      logger.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Change password (for authenticated users)
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Update password
      user.password = newPassword;
      
      // Clear all refresh tokens except current session for security
      // (This would require tracking current session, simplified for now)
      user.refreshTokens = [];
      
      await user.save();
      
      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}
