import express from 'express';
import { authController } from '@/controllers/authController';
import { validateAuth } from '@/middleware/validation';
import { auth } from '@/middleware/auth';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateAuth.register, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateAuth.login, authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', auth, authController.logoutAll);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', authController.refreshToken);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validateAuth.forgotPassword, authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validateAuth.resetPassword, authController.resetPassword);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', validateAuth.verifyEmail, authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', validateAuth.forgotPassword, authController.resendVerification);

// @route   POST /api/auth/change-password
// @desc    Change password (for authenticated users)
// @access  Private
router.post('/change-password', auth, validateAuth.changePassword, authController.changePassword);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, authController.getProfile);

// OAuth routes
// @route   GET /api/auth/google
// @desc    Google OAuth
// @access  Public
router.get('/google', authController.googleAuth);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', authController.googleCallback);

// @route   GET /api/auth/facebook
// @desc    Facebook OAuth
// @access  Public
router.get('/facebook', authController.facebookAuth);

// @route   GET /api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get('/facebook/callback', authController.facebookCallback);

export default router;
