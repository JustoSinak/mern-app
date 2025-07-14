import { User, Product, Order, Category } from '../models';
import { ISalesAnalytics, IUserAnalytics, IProductAnalytics, IOrderAnalytics, IDashboardStats } from '../types/admin';
import { logger } from '../utils/logger';

export class AnalyticsService {
  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(days: number = 30): Promise<ISalesAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic sales metrics
    const salesMetrics = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get previous period for growth calculation
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const previousMetrics = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: previousStartDate, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Calculate growth rates
    const currentMetrics = salesMetrics[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
    const prevMetrics = previousMetrics[0] || { totalRevenue: 0, totalOrders: 0 };

    const revenueGrowth = prevMetrics.totalRevenue > 0 
      ? ((currentMetrics.totalRevenue - prevMetrics.totalRevenue) / prevMetrics.totalRevenue) * 100 
      : 0;
    
    const ordersGrowth = prevMetrics.totalOrders > 0 
      ? ((currentMetrics.totalOrders - prevMetrics.totalOrders) / prevMetrics.totalOrders) * 100 
      : 0;

    // Get daily revenue data
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get monthly revenue data (last 12 months)
    const monthlyStartDate = new Date();
    monthlyStartDate.setMonth(monthlyStartDate.getMonth() - 12);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: monthlyStartDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top selling products
    const topSellingProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Get top categories
    const topCategories = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryId: '$_id',
          name: '$category.name',
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    return {
      totalRevenue: currentMetrics.totalRevenue,
      totalOrders: currentMetrics.totalOrders,
      averageOrderValue: currentMetrics.averageOrderValue,
      revenueGrowth,
      ordersGrowth,
      dailyRevenue: dailyRevenue.map(item => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders
      })),
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item._id,
        revenue: item.revenue,
        orders: item.orders
      })),
      topSellingProducts: topSellingProducts.map(item => ({
        productId: item.productId.toString(),
        name: item.name,
        totalSold: item.totalSold,
        revenue: item.revenue
      })),
      topCategories: topCategories.map(item => ({
        categoryId: item.categoryId.toString(),
        name: item.name,
        totalSold: item.totalSold,
        revenue: item.revenue
      }))
    };
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(days: number = 30): Promise<IUserAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Basic user metrics
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    // User retention rate (users who made a second order)
    const retentionData = await User.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      {
        $project: {
          orderCount: { $size: '$orders' }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          returningUsers: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } }
        }
      }
    ]);

    const userRetentionRate = retentionData[0] 
      ? (retentionData[0].returningUsers / retentionData[0].totalUsers) * 100 
      : 0;

    // Daily registrations
    const dailyRegistrations = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Monthly registrations (last 12 months)
    const monthlyStartDate = new Date();
    monthlyStartDate.setMonth(monthlyStartDate.getMonth() - 12);

    const monthlyRegistrations = await User.aggregate([
      {
        $match: { createdAt: { $gte: monthlyStartDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User behavior metrics
    const userBehavior = await User.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      {
        $project: {
          orderCount: { $size: '$orders' },
          totalSpent: { $sum: '$orders.totalAmount' }
        }
      },
      {
        $group: {
          _id: null,
          averageOrdersPerUser: { $avg: '$orderCount' },
          averageLifetimeValue: { $avg: '$totalSpent' }
        }
      }
    ]);

    const behaviorMetrics = userBehavior[0] || { averageOrdersPerUser: 0, averageLifetimeValue: 0 };

    return {
      totalUsers,
      activeUsers,
      newUsers,
      userRetentionRate,
      dailyRegistrations: dailyRegistrations.map(item => ({
        date: item._id,
        count: item.count
      })),
      monthlyRegistrations: monthlyRegistrations.map(item => ({
        month: item._id,
        count: item.count
      })),
      averageOrdersPerUser: behaviorMetrics.averageOrdersPerUser,
      averageLifetimeValue: behaviorMetrics.averageLifetimeValue,
      usersByCountry: [], // Would need address data
      usersByAge: [] // Would need age calculation from dateOfBirth
    };
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(): Promise<IProductAnalytics> {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ inventory: 0 }),
      Product.countDocuments({ inventory: { $lte: 10, $gt: 0 } })
    ]);

    // Average rating and total reviews
    const ratingStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$averageRating' },
          totalReviews: { $sum: '$reviewCount' }
        }
      }
    ]);

    const { averageRating = 0, totalReviews = 0 } = ratingStats[0] || {};

    // Inventory value
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$inventory'] } }
        }
      }
    ]);

    // Slow moving products (no sales in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const slowMovingProducts = await Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { productId: '$_id' },
          pipeline: [
            { $unwind: '$items' },
            {
              $match: {
                $expr: { $eq: ['$items.productId', '$$productId'] },
                createdAt: { $gte: thirtyDaysAgo },
                status: { $in: ['delivered', 'shipped'] }
              }
            }
          ],
          as: 'recentOrders'
        }
      },
      {
        $match: {
          recentOrders: { $size: 0 },
          inventory: { $gt: 0 }
        }
      },
      {
        $project: {
          productId: '$_id',
          name: 1,
          stock: '$inventory',
          lastSold: '$updatedAt' // Approximation
        }
      },
      { $limit: 20 }
    ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryId: '$_id',
          name: '$category.name',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      averageRating,
      totalReviews,
      inventoryValue: inventoryValue[0]?.totalValue || 0,
      slowMovingProducts: slowMovingProducts.map(item => ({
        productId: item.productId.toString(),
        name: item.name,
        stock: item.stock,
        lastSold: item.lastSold
      })),
      productsByCategory: productsByCategory.map(item => ({
        categoryId: item.categoryId.toString(),
        name: item.name,
        count: item.count
      }))
    };
  }

  /**
   * Get order analytics
   */
  static async getOrderAnalytics(days: number = 30): Promise<IOrderAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Order counts by status
    const orderCounts = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = orderCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as any);

    // Daily orders
    const dailyOrders = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Monthly orders
    const monthlyStartDate = new Date();
    monthlyStartDate.setMonth(monthlyStartDate.getMonth() - 12);

    const monthlyOrders = await Order.aggregate([
      {
        $match: { createdAt: { $gte: monthlyStartDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      totalOrders: Object.values(statusCounts).reduce((sum: number, count: any) => sum + count, 0),
      pendingOrders: statusCounts.pending || 0,
      processingOrders: statusCounts.processing || 0,
      shippedOrders: statusCounts.shipped || 0,
      deliveredOrders: statusCounts.delivered || 0,
      cancelledOrders: statusCounts.cancelled || 0,
      dailyOrders: dailyOrders.map(item => ({
        date: item._id,
        count: item.count
      })),
      monthlyOrders: monthlyOrders.map(item => ({
        month: item._id,
        count: item.count
      })),
      ordersByStatus: orderCounts.map(item => ({
        status: item._id,
        count: item.count
      })),
      averageProcessingTime: 0, // Would need more complex calculation
      averageShippingTime: 0 // Would need more complex calculation
    };
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<IDashboardStats> {
    const [sales, users, products, orders] = await Promise.all([
      this.getSalesAnalytics(30),
      this.getUserAnalytics(30),
      this.getProductAnalytics(),
      this.getOrderAnalytics(30)
    ]);

    // Quick stats for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRevenue, todayOrders, todayUsers, activePromotions] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: { $in: ['delivered', 'shipped'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      // Would need Promotion model
      0 // Placeholder
    ]);

    const quickStats = {
      todayRevenue: todayRevenue[0]?.total || 0,
      todayOrders,
      todayUsers,
      pendingOrders: orders.pendingOrders,
      lowStockAlerts: products.lowStockProducts,
      activePromotions
    };

    return {
      sales,
      users,
      products,
      orders,
      quickStats
    };
  }
}
