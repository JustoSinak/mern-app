import express from 'express';
import { orderController } from '../controllers/orderController';
import { auth, adminAuth } from '../middleware/auth';
import { validateOrder } from '../middleware/validation';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, validateOrder.create, orderController.createOrder);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', auth, orderController.getUserOrders);

// @route   GET /api/orders/all
// @desc    Get all orders (admin)
// @access  Private/Admin
router.get('/all', auth, adminAuth, orderController.getAllOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, orderController.getOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', auth, adminAuth, validateOrder.updateStatus, orderController.updateOrderStatus);

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post('/:id/cancel', auth, orderController.cancelOrder);

// @route   POST /api/orders/:id/refund
// @desc    Process refund
// @access  Private/Admin
router.post('/:id/refund', auth, adminAuth, validateOrder.refund, orderController.processRefund);

// @route   GET /api/orders/:id/tracking
// @desc    Get order tracking information
// @access  Private
router.get('/:id/tracking', auth, orderController.getOrderTracking);

// @route   POST /api/orders/:id/return
// @desc    Request order return
// @access  Private
router.post('/:id/return', auth, validateOrder.return, orderController.requestReturn);

export default router;
