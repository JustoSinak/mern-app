"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("@/controllers/productController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.get('/', productController_1.productController.getProducts);
router.get('/search', productController_1.productController.searchProducts);
router.get('/categories', productController_1.productController.getCategories);
router.get('/featured', productController_1.productController.getFeaturedProducts);
router.get('/recommendations/:userId', auth_1.auth, productController_1.productController.getRecommendations);
router.get('/:id', productController_1.productController.getProduct);
router.post('/', auth_1.auth, auth_1.adminAuth, validation_1.validateProduct.create, productController_1.productController.createProduct);
router.put('/:id', auth_1.auth, auth_1.adminAuth, validation_1.validateProduct.update, productController_1.productController.updateProduct);
router.delete('/:id', auth_1.auth, auth_1.adminAuth, productController_1.productController.deleteProduct);
router.post('/:id/reviews', auth_1.auth, validation_1.validateProduct.review, productController_1.productController.addReview);
router.put('/:id/reviews/:reviewId', auth_1.auth, validation_1.validateProduct.review, productController_1.productController.updateReview);
router.delete('/:id/reviews/:reviewId', auth_1.auth, productController_1.productController.deleteReview);
router.put('/:id/inventory', auth_1.auth, auth_1.adminAuth, validation_1.validateProduct.inventory, productController_1.productController.updateInventory);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map