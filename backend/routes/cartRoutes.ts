import express from 'express';
import { cartController } from '../controllers/cartController';
import { auth } from '../middleware/auth';
import { validateCart } from '../middleware/validation';

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get('/', auth, cartController.getCart);

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', auth, validateCart.addItem, cartController.addItem);

// @route   PUT /api/cart/items/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:itemId', auth, validateCart.updateItem, cartController.updateItem);

// @route   DELETE /api/cart/items/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:itemId', auth, cartController.removeItem);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', auth, cartController.clearCart);

// @route   POST /api/cart/merge
// @desc    Merge guest cart with user cart
// @access  Private
router.post('/merge', auth, validateCart.merge, cartController.mergeCart);

// @route   GET /api/cart/summary
// @desc    Get cart summary
// @access  Private
router.get('/summary', auth, cartController.getCartSummary);

export default router;
