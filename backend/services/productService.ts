import { Product, Category } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ICreateProductRequest, IUpdateProductRequest, IProductSearchQuery, IAddReviewRequest } from '../types/product';
import { Types } from 'mongoose';

export class ProductService {
  /**
   * Get products with filtering, sorting, and pagination
   */
  static async getProducts(query: IProductSearchQuery) {
    try {
      const {
        q,
        category,
        brand,
        minPrice,
        maxPrice,
        rating,
        inStock,
        featured,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = query;

      // Build filter object
      const filter: any = {
        status: 'active',
        isVisible: true
      };

      // Text search
      if (q) {
        filter.$text = { $search: q };
      }

      // Category filter
      if (category) {
        filter.category = category;
      }

      // Brand filter
      if (brand) {
        filter.brand = new RegExp(brand, 'i');
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }

      // Rating filter
      if (rating) {
        filter.averageRating = { $gte: rating };
      }

      // Stock filter
      if (inStock !== undefined) {
        if (inStock) {
          filter.$or = [
            { trackInventory: false },
            { inventory: { $gt: 0 } },
            { allowBackorder: true }
          ];
        } else {
          filter.trackInventory = true;
          filter.inventory = { $lte: 0 };
          filter.allowBackorder = false;
        }
      }

      // Featured filter
      if (featured !== undefined) {
        filter.isFeatured = featured;
      }

      // Build sort object
      const sort: any = {};
      if (sortBy === 'price') {
        sort.price = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'rating') {
        sort.averageRating = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'name') {
        sort.name = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'sales') {
        sort.totalSales = sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      }

      // Add text score for text search
      if (q) {
        sort.score = { $meta: 'textScore' };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter)
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
    } catch (error) {
      logger.error('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID or slug
   */
  static async getProduct(identifier: string) {
    try {
      const isObjectId = Types.ObjectId.isValid(identifier);
      const filter = isObjectId ? { _id: identifier } : { slug: identifier };

      const product = await Product.findOne({
        ...filter,
        status: 'active',
        isVisible: true
      })
        .populate('category', 'name slug')
        .populate('reviews.userId', 'firstName lastName avatar');

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Increment view count
      await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

      return product;
    } catch (error) {
      logger.error('Error getting product:', error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  static async createProduct(productData: ICreateProductRequest, userId: string) {
    try {
      // Check if SKU already exists
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        throw new AppError('Product with this SKU already exists', 400);
      }

      // Verify category exists
      const category = await Category.findById(productData.category);
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Create product
      const product = new Product({
        ...productData,
        status: 'draft'
      });

      await product.save();

      logger.info(`Product created: ${product.name} by user ${userId}`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, updateData: IUpdateProductRequest, userId: string) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Check SKU uniqueness if being updated
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await Product.findOne({ sku: updateData.sku });
        if (existingProduct) {
          throw new AppError('Product with this SKU already exists', 400);
        }
      }

      // Verify category if being updated
      if (updateData.category) {
        const category = await Category.findById(updateData.category);
        if (!category) {
          throw new AppError('Category not found', 404);
        }
      }

      // Update product
      Object.assign(product, updateData);
      await product.save();

      logger.info(`Product updated: ${product.name} by user ${userId}`);
      return product;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string, userId: string) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Soft delete by setting status to archived
      product.status = 'archived';
      product.isVisible = false;
      await product.save();

      logger.info(`Product deleted: ${product.name} by user ${userId}`);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Add product review
   */
  static async addReview(productId: string, reviewData: IAddReviewRequest, userId: string, userName: string, userAvatar?: string) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Check if user already reviewed this product
      const existingReview = product.reviews.find(review => 
        review.userId.toString() === userId
      );
      if (existingReview) {
        throw new AppError('You have already reviewed this product', 400);
      }

      // Add review
      await product.addReview({
        userId: new Types.ObjectId(userId),
        userName,
        userAvatar,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        images: reviewData.images || [],
        isVerifiedPurchase: false, // TODO: Check if user purchased this product
        helpfulVotes: 0
      });

      await product.save();

      logger.info(`Review added for product ${product.name} by user ${userId}`);
      return product;
    } catch (error) {
      logger.error('Error adding review:', error);
      throw error;
    }
  }

  /**
   * Update inventory
   */
  static async updateInventory(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set', userId: string) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (!product.trackInventory) {
        throw new AppError('This product does not track inventory', 400);
      }

      const oldInventory = product.inventory;

      if (operation === 'set') {
        product.inventory = quantity;
      } else {
        await product.updateInventory(quantity, operation);
      }

      await product.save();

      logger.info(`Inventory updated for product ${product.name}: ${oldInventory} -> ${product.inventory} by user ${userId}`);
      return product;
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 10) {
    try {
      const products = await Product.find({
        status: 'active',
        isVisible: true,
        isFeatured: true
      })
        .populate('category', 'name slug')
        .sort({ totalSales: -1, averageRating: -1 })
        .limit(limit)
        .lean();

      return products;
    } catch (error) {
      logger.error('Error getting featured products:', error);
      throw error;
    }
  }

  /**
   * Get product categories
   */
  static async getCategories() {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      return categories;
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Search products with advanced filters
   */
  static async searchProducts(searchQuery: string, filters: any = {}) {
    try {
      const pipeline: any[] = [
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

      // Add category filter if provided
      if (filters.category) {
        pipeline[0].$match.category = new Types.ObjectId(filters.category);
      }

      // Add price range filter
      if (filters.minPrice || filters.maxPrice) {
        pipeline[0].$match.price = {};
        if (filters.minPrice) pipeline[0].$match.price.$gte = filters.minPrice;
        if (filters.maxPrice) pipeline[0].$match.price.$lte = filters.maxPrice;
      }

      // Populate category
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

      const products = await Product.aggregate(pipeline);
      return products;
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }
}
