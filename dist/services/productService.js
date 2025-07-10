"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const models_1 = require("@/models");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const mongoose_1 = require("mongoose");
class ProductService {
    static async getProducts(query) {
        try {
            const { q, category, brand, minPrice, maxPrice, rating, inStock, featured, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = query;
            const filter = {
                status: 'active',
                isVisible: true
            };
            if (q) {
                filter.$text = { $search: q };
            }
            if (category) {
                filter.category = category;
            }
            if (brand) {
                filter.brand = new RegExp(brand, 'i');
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.price = {};
                if (minPrice !== undefined)
                    filter.price.$gte = minPrice;
                if (maxPrice !== undefined)
                    filter.price.$lte = maxPrice;
            }
            if (rating) {
                filter.averageRating = { $gte: rating };
            }
            if (inStock !== undefined) {
                if (inStock) {
                    filter.$or = [
                        { trackInventory: false },
                        { inventory: { $gt: 0 } },
                        { allowBackorder: true }
                    ];
                }
                else {
                    filter.trackInventory = true;
                    filter.inventory = { $lte: 0 };
                    filter.allowBackorder = false;
                }
            }
            if (featured !== undefined) {
                filter.isFeatured = featured;
            }
            const sort = {};
            if (sortBy === 'price') {
                sort.price = sortOrder === 'asc' ? 1 : -1;
            }
            else if (sortBy === 'rating') {
                sort.averageRating = sortOrder === 'asc' ? 1 : -1;
            }
            else if (sortBy === 'name') {
                sort.name = sortOrder === 'asc' ? 1 : -1;
            }
            else if (sortBy === 'sales') {
                sort.totalSales = sortOrder === 'asc' ? 1 : -1;
            }
            else {
                sort.createdAt = sortOrder === 'asc' ? 1 : -1;
            }
            if (q) {
                sort.score = { $meta: 'textScore' };
            }
            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                models_1.Product.find(filter)
                    .populate('category', 'name slug')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                models_1.Product.countDocuments(filter)
            ]);
            return {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting products:', error);
            throw error;
        }
    }
    static async getProduct(identifier) {
        try {
            const isObjectId = mongoose_1.Types.ObjectId.isValid(identifier);
            const filter = isObjectId ? { _id: identifier } : { slug: identifier };
            const product = await models_1.Product.findOne({
                ...filter,
                status: 'active',
                isVisible: true
            })
                .populate('category', 'name slug')
                .populate('reviews.userId', 'firstName lastName avatar');
            if (!product) {
                throw new errorHandler_1.AppError('Product not found', 404);
            }
            await models_1.Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error getting product:', error);
            throw error;
        }
    }
    static async createProduct(productData, userId) {
        try {
            const existingProduct = await models_1.Product.findOne({ sku: productData.sku });
            if (existingProduct) {
                throw new errorHandler_1.AppError('Product with this SKU already exists', 400);
            }
            const category = await models_1.Category.findById(productData.category);
            if (!category) {
                throw new errorHandler_1.AppError('Category not found', 404);
            }
            const product = new models_1.Product({
                ...productData,
                status: 'draft'
            });
            await product.save();
            logger_1.logger.info(`Product created: ${product.name} by user ${userId}`);
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error creating product:', error);
            throw error;
        }
    }
    static async updateProduct(productId, updateData, userId) {
        try {
            const product = await models_1.Product.findById(productId);
            if (!product) {
                throw new errorHandler_1.AppError('Product not found', 404);
            }
            if (updateData.sku && updateData.sku !== product.sku) {
                const existingProduct = await models_1.Product.findOne({ sku: updateData.sku });
                if (existingProduct) {
                    throw new errorHandler_1.AppError('Product with this SKU already exists', 400);
                }
            }
            if (updateData.category) {
                const category = await models_1.Category.findById(updateData.category);
                if (!category) {
                    throw new errorHandler_1.AppError('Category not found', 404);
                }
            }
            Object.assign(product, updateData);
            await product.save();
            logger_1.logger.info(`Product updated: ${product.name} by user ${userId}`);
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error updating product:', error);
            throw error;
        }
    }
    static async deleteProduct(productId, userId) {
        try {
            const product = await models_1.Product.findById(productId);
            if (!product) {
                throw new errorHandler_1.AppError('Product not found', 404);
            }
            product.status = 'archived';
            product.isVisible = false;
            await product.save();
            logger_1.logger.info(`Product deleted: ${product.name} by user ${userId}`);
            return { message: 'Product deleted successfully' };
        }
        catch (error) {
            logger_1.logger.error('Error deleting product:', error);
            throw error;
        }
    }
    static async addReview(productId, reviewData, userId, userName, userAvatar) {
        try {
            const product = await models_1.Product.findById(productId);
            if (!product) {
                throw new errorHandler_1.AppError('Product not found', 404);
            }
            const existingReview = product.reviews.find(review => review.userId.toString() === userId);
            if (existingReview) {
                throw new errorHandler_1.AppError('You have already reviewed this product', 400);
            }
            await product.addReview({
                userId: new mongoose_1.Types.ObjectId(userId),
                userName,
                userAvatar,
                rating: reviewData.rating,
                title: reviewData.title,
                comment: reviewData.comment,
                images: reviewData.images || [],
                isVerifiedPurchase: false,
                helpfulVotes: 0
            });
            await product.save();
            logger_1.logger.info(`Review added for product ${product.name} by user ${userId}`);
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error adding review:', error);
            throw error;
        }
    }
    static async updateInventory(productId, quantity, operation, userId) {
        try {
            const product = await models_1.Product.findById(productId);
            if (!product) {
                throw new errorHandler_1.AppError('Product not found', 404);
            }
            if (!product.trackInventory) {
                throw new errorHandler_1.AppError('This product does not track inventory', 400);
            }
            const oldInventory = product.inventory;
            if (operation === 'set') {
                product.inventory = quantity;
            }
            else {
                await product.updateInventory(quantity, operation);
            }
            await product.save();
            logger_1.logger.info(`Inventory updated for product ${product.name}: ${oldInventory} -> ${product.inventory} by user ${userId}`);
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error updating inventory:', error);
            throw error;
        }
    }
    static async getFeaturedProducts(limit = 10) {
        try {
            const products = await models_1.Product.find({
                status: 'active',
                isVisible: true,
                isFeatured: true
            })
                .populate('category', 'name slug')
                .sort({ totalSales: -1, averageRating: -1 })
                .limit(limit)
                .lean();
            return products;
        }
        catch (error) {
            logger_1.logger.error('Error getting featured products:', error);
            throw error;
        }
    }
    static async getCategories() {
        try {
            const categories = await models_1.Category.find({ isActive: true })
                .sort({ sortOrder: 1, name: 1 })
                .lean();
            return categories;
        }
        catch (error) {
            logger_1.logger.error('Error getting categories:', error);
            throw error;
        }
    }
    static async searchProducts(searchQuery, filters = {}) {
        try {
            const pipeline = [
                {
                    $match: {
                        status: 'active',
                        isVisible: true,
                        $text: { $search: searchQuery }
                    }
                },
                {
                    $addFields: {
                        score: { $meta: 'textScore' }
                    }
                },
                {
                    $sort: { score: { $meta: 'textScore' } }
                }
            ];
            if (filters.category) {
                pipeline[0].$match.category = new mongoose_1.Types.ObjectId(filters.category);
            }
            if (filters.minPrice || filters.maxPrice) {
                pipeline[0].$match.price = {};
                if (filters.minPrice)
                    pipeline[0].$match.price.$gte = filters.minPrice;
                if (filters.maxPrice)
                    pipeline[0].$match.price.$lte = filters.maxPrice;
            }
            pipeline.push({
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            });
            pipeline.push({
                $unwind: '$category'
            });
            const products = await models_1.Product.aggregate(pipeline);
            return products;
        }
        catch (error) {
            logger_1.logger.error('Error searching products:', error);
            throw error;
        }
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=productService.js.map