import { Product, Category, Order, AdminActivity } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ICreateProductRequest, IUpdateProductRequest, IProductSearchQuery } from '../types/product';
import { IBulkProductOperation } from '../types/admin';
import { Types } from 'mongoose';

export class AdminProductService {
  /**
   * Get all products for admin (including inactive)
   */
  static async getAdminProducts(query: IProductSearchQuery) {
    const {
      q,
      category,
      brand,
      status,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = query;

    // Build filter object (no status restriction for admin)
    const filter: any = {};

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Brand filter
    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Stock filter
    if (inStock !== undefined) {
      filter.inventory = inStock ? { $gt: 0 } : { $lte: 0 };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Bulk operations on products
   */
  static async bulkOperation(operation: IBulkProductOperation, adminId: string) {
    const { productIds, operation: op, data } = operation;

    if (!productIds || productIds.length === 0) {
      throw new AppError('No products selected', 400);
    }

    let updateQuery: any = {};
    let operationName = '';

    switch (op) {
      case 'activate':
        updateQuery = { status: 'active', isVisible: true };
        operationName = 'bulk_activate_products';
        break;
      case 'deactivate':
        updateQuery = { status: 'inactive', isVisible: false };
        operationName = 'bulk_deactivate_products';
        break;
      case 'delete':
        updateQuery = { status: 'archived', isVisible: false };
        operationName = 'bulk_delete_products';
        break;
      case 'updateCategory':
        if (!data?.categoryId) {
          throw new AppError('Category ID is required for category update operation', 400);
        }
        updateQuery = { category: data.categoryId };
        operationName = 'bulk_update_product_categories';
        break;
      case 'updatePrice':
        if (data?.priceMultiplier) {
          // Bulk price update with multiplier
          const products = await Product.find({ _id: { $in: productIds } });
          const bulkOps = products.map(product => ({
            updateOne: {
              filter: { _id: product._id },
              update: { price: Math.round(product.price * data.priceMultiplier! * 100) / 100 }
            }
          }));
          const result = await Product.bulkWrite(bulkOps);
          
          await AdminActivity.logActivity(
            adminId,
            'bulk_update_product_prices',
            'product',
            {
              productIds,
              priceMultiplier: data.priceMultiplier,
              affectedCount: result.modifiedCount
            }
          );
          
          return {
            message: 'Bulk price update completed successfully',
            affectedCount: result.modifiedCount
          };
        } else if (data?.fixedPrice) {
          updateQuery = { price: data.fixedPrice };
          operationName = 'bulk_set_product_prices';
        } else {
          throw new AppError('Price multiplier or fixed price is required for price update operation', 400);
        }
        break;
      default:
        throw new AppError('Invalid bulk operation', 400);
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateQuery
    );

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      operationName,
      'product',
      {
        productIds,
        operation: op,
        data,
        affectedCount: result.modifiedCount
      }
    );

    return {
      message: 'Bulk operation completed successfully',
      affectedCount: result.modifiedCount
    };
  }

  /**
   * Update product inventory
   */
  static async updateInventory(productId: string, quantity: number, operation: 'set' | 'add' | 'subtract', adminId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const originalInventory = product.inventory;
    let newInventory: number;

    switch (operation) {
      case 'set':
        newInventory = quantity;
        break;
      case 'add':
        newInventory = product.inventory + quantity;
        break;
      case 'subtract':
        newInventory = Math.max(0, product.inventory - quantity);
        break;
      default:
        throw new AppError('Invalid inventory operation', 400);
    }

    product.inventory = newInventory;
    await product.save();

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      'update_product_inventory',
      'product',
      {
        productId,
        operation,
        quantity,
        originalInventory,
        newInventory
      },
      productId
    );

    return product;
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(threshold: number = 10) {
    const products = await Product.find({
      inventory: { $lte: threshold, $gt: 0 },
      status: 'active'
    })
    .populate('category', 'name')
    .sort({ inventory: 1 })
    .lean();

    return products;
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts() {
    const products = await Product.find({
      inventory: 0,
      status: 'active'
    })
    .populate('category', 'name')
    .sort({ updatedAt: -1 })
    .lean();

    return products;
  }

  /**
   * Get product performance analytics
   */
  static async getProductPerformance(productId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [salesData, reviewData] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['delivered', 'shipped'] }
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.productId': new Types.ObjectId(productId)
          }
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            averagePrice: { $avg: '$items.price' },
            orderCount: { $sum: 1 }
          }
        }
      ]),
      Product.findById(productId).select('averageRating reviewCount reviews').lean()
    ]);

    const sales = salesData[0] || {
      totalSold: 0,
      totalRevenue: 0,
      averagePrice: 0,
      orderCount: 0
    };

    return {
      sales,
      reviews: {
        averageRating: reviewData?.averageRating || 0,
        totalReviews: reviewData?.reviewCount || 0,
        recentReviews: reviewData?.reviews?.slice(-5) || []
      }
    };
  }

  /**
   * Import products from CSV data
   */
  static async importProducts(csvData: any[], adminId: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const [index, row] of csvData.entries()) {
      try {
        // Validate required fields
        if (!row.name || !row.price || !row.category) {
          results.errors.push(`Row ${index + 1}: Missing required fields (name, price, category)`);
          results.failed++;
          continue;
        }

        // Find or create category
        let category = await Category.findOne({ name: row.category });
        if (!category) {
          category = new Category({
            name: row.category,
            slug: row.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          });
          await category.save();
        }

        // Create product
        const productData = {
          name: row.name,
          description: row.description || '',
          price: parseFloat(row.price),
          category: category._id,
          brand: row.brand || '',
          sku: row.sku || '',
          inventory: parseInt(row.inventory) || 0,
          status: row.status || 'active',
          isVisible: row.isVisible !== 'false'
        };

        const product = new Product(productData);
        await product.save();
        results.success++;
      } catch (error) {
        results.errors.push(`Row ${index + 1}: ${(error as Error).message}`);
        results.failed++;
      }
    }

    // Log admin activity
    await AdminActivity.logActivity(
      adminId,
      'import_products',
      'product',
      {
        totalRows: csvData.length,
        successCount: results.success,
        failedCount: results.failed,
        errors: results.errors.slice(0, 10) // Log first 10 errors
      }
    );

    return results;
  }

  /**
   * Export products to CSV format
   */
  static async exportProducts(filters: any = {}) {
    const products = await Product.find(filters)
      .populate('category', 'name')
      .lean();

    const csvData = products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: (product.category as any)?.name || '',
      brand: product.brand,
      sku: product.sku,
      inventory: product.inventory,
      status: product.status,
      isVisible: product.isVisible,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      totalSales: product.totalSales,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return csvData;
  }
}
