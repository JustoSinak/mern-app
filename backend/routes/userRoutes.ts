import express from 'express';
import { userController } from '@/controllers/userController';
import { auth } from '@/middleware/auth';
import { validateUser } from '@/middleware/validation';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, validateUser.updateProfile, userController.updateProfile);

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', auth, userController.deleteAccount);

// @route   GET /api/users/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', auth, userController.getUserOrders);

// @route   GET /api/users/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/wishlist', auth, userController.getWishlist);

// @route   POST /api/users/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', auth, userController.addToWishlist);

// @route   DELETE /api/users/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', auth, userController.removeFromWishlist);

// @route   GET /api/users/addresses
// @desc    Get user addresses
// @access  Private
router.get('/addresses', auth, userController.getAddresses);

// @route   POST /api/users/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', auth, validateUser.address, userController.addAddress);

// @route   PUT /api/users/addresses/:addressId
// @desc    Update address
// @access  Private
router.put('/addresses/:addressId', auth, validateUser.address, userController.updateAddress);

// @route   DELETE /api/users/addresses/:addressId
// @desc    Delete address
// @access  Private
router.delete('/addresses/:addressId', auth, userController.deleteAddress);

export default router;
