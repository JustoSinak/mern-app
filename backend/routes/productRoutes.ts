import express from 'express';
import { productController } from '../controllers/productController';
import { auth, adminAuth } from '../middleware/auth';
import { validateProduct } from '../middleware/validation';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', productController.getProducts);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', productController.searchProducts);

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
router.get('/categories', productController.getCategories);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', productController.getFeaturedProducts);

// @route   GET /api/products/recommendations/:userId
// @desc    Get product recommendations for user
// @access  Private
router.get('/recommendations/:userId', auth, productController.getRecommendations);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', productController.getProduct);

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post('/', auth, adminAuth, validateProduct.create, productController.createProduct);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', auth, adminAuth, validateProduct.update, productController.updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, productController.deleteProduct);

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private
router.post('/:id/reviews', auth, validateProduct.review, productController.addReview);

// @route   PUT /api/products/:id/reviews/:reviewId
// @desc    Update product review
// @access  Private
router.put('/:id/reviews/:reviewId', auth, validateProduct.review, productController.updateReview);

// @route   DELETE /api/products/:id/reviews/:reviewId
// @desc    Delete product review
// @access  Private
router.delete('/:id/reviews/:reviewId', auth, productController.deleteReview);

// @route   PUT /api/products/:id/inventory
// @desc    Update product inventory
// @access  Private/Admin
router.put('/:id/inventory', auth, adminAuth, validateProduct.inventory, productController.updateInventory);

export default router;
