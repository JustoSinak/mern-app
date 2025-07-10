"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const productService_1 = require("@/services/productService");
exports.productController = {
    getProducts: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const query = req.query;
        const result = await productService_1.ProductService.getProducts(query);
        res.json({
            success: true,
            data: result.products,
            pagination: result.pagination
        });
    }),
    searchProducts: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { q, ...filters } = req.query;
        if (!q) {
            res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
            return;
        }
        const products = await productService_1.ProductService.searchProducts(q, filters);
        res.json({
            success: true,
            data: products
        });
    }),
    getCategories: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const categories = await productService_1.ProductService.getCategories();
        res.json({
            success: true,
            data: categories
        });
    }),
    getFeaturedProducts: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const limit = parseInt(req.query.limit) || 10;
        const products = await productService_1.ProductService.getFeaturedProducts(limit);
        res.json({
            success: true,
            data: products
        });
    }),
    getRecommendations: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const products = await productService_1.ProductService.getFeaturedProducts(10);
        res.json({
            success: true,
            data: products,
            message: 'Basic recommendations (ML recommendations coming soon)'
        });
    }),
    getProduct: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
            return;
        }
        const product = await productService_1.ProductService.getProduct(id);
        res.json({
            success: true,
            data: product
        });
    }),
    createProduct: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const productData = req.body;
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const product = await productService_1.ProductService.createProduct(productData, userId);
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    }),
    updateProduct: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const product = await productService_1.ProductService.updateProduct(id, updateData, userId);
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    }),
    deleteProduct: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        const userId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const result = await productService_1.ProductService.deleteProduct(id, userId);
        res.json({
            success: true,
            message: result.message
        });
    }),
    addReview: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        const reviewData = req.body;
        const user = req.user;
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
            return;
        }
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const product = await productService_1.ProductService.addReview(id, reviewData, user._id.toString(), `${user.firstName} ${user.lastName}`, user.avatar);
        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: product
        });
    }),
    updateReview: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Review update not implemented yet'
        });
    }),
    deleteReview: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        res.status(501).json({
            success: false,
            message: 'Review deletion not implemented yet'
        });
    }),
    updateInventory: (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        const { id } = req.params;
        const { quantity, operation } = req.body;
        const userId = req.user?._id?.toString();
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const product = await productService_1.ProductService.updateInventory(id, quantity, operation, userId);
        res.json({
            success: true,
            message: 'Inventory updated successfully',
            data: {
                productId: product._id,
                name: product.name,
                inventory: product.inventory
            }
        });
    })
};
//# sourceMappingURL=productController.js.map