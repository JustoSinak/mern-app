import { Types } from 'mongoose';

// Permission system types
export interface IPermission {
  _id: Types.ObjectId;
  name: string;
  description: string;
  resource: string; // e.g., 'users', 'products', 'orders'
  actions: string[]; // e.g., ['create', 'read', 'update', 'delete']
  createdAt: Date;
  updatedAt: Date;
}

export interface IRole {
  _id: Types.ObjectId;
  name: string;
  description: string;
  permissions: Types.ObjectId[]; // Permission IDs
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Promotion system types
export interface IPromotion {
  _id: Types.ObjectId;
  name: string;
  description: string;
  code: string;
  type: 'percentage' | 'fixed' | 'buy_one_get_one' | 'free_shipping';
  value: number; // percentage (0-100) or fixed amount
  
  // Conditions
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  applicableProducts?: Types.ObjectId[]; // Product IDs
  applicableCategories?: Types.ObjectId[]; // Category IDs
  
  // Usage limits
  usageLimit?: number; // Total usage limit
  usageLimitPerUser?: number;
  currentUsage: number;
  
  // Date constraints
  startDate: Date;
  endDate: Date;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: Types.ObjectId; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromotionUsage {
  _id: Types.ObjectId;
  promotionId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  discountAmount: number;
  usedAt: Date;
}

export interface ICreatePromotionRequest {
  name: string;
  description: string;
  code: string;
  type: 'percentage' | 'fixed' | 'buy_one_get_one' | 'free_shipping';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  usageLimit?: number;
  usageLimitPerUser?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface IPromotionSearchQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'currentUsage';
  sortOrder?: 'asc' | 'desc';
}

// Analytics types
export interface ISalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number; // percentage
  ordersGrowth: number; // percentage
  
  // Time-based data
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  
  // Product performance
  topSellingProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  
  // Category performance
  topCategories: Array<{
    categoryId: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface IUserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userRetentionRate: number;
  
  // Registration trends
  dailyRegistrations: Array<{ date: string; count: number }>;
  monthlyRegistrations: Array<{ month: string; count: number }>;
  
  // User behavior
  averageOrdersPerUser: number;
  averageLifetimeValue: number;
  
  // Demographics
  usersByCountry: Array<{ country: string; count: number }>;
  usersByAge: Array<{ ageRange: string; count: number }>;
}

export interface IProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  
  // Performance metrics
  averageRating: number;
  totalReviews: number;
  
  // Inventory insights
  inventoryValue: number;
  slowMovingProducts: Array<{
    productId: string;
    name: string;
    stock: number;
    lastSold: Date;
  }>;
  
  // Category distribution
  productsByCategory: Array<{
    categoryId: string;
    name: string;
    count: number;
  }>;
}

export interface IOrderAnalytics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  
  // Order trends
  dailyOrders: Array<{ date: string; count: number }>;
  monthlyOrders: Array<{ month: string; count: number }>;
  
  // Order status distribution
  ordersByStatus: Array<{ status: string; count: number }>;
  
  // Average processing times
  averageProcessingTime: number; // in hours
  averageShippingTime: number; // in hours
}

export interface IDashboardStats {
  sales: ISalesAnalytics;
  users: IUserAnalytics;
  products: IProductAnalytics;
  orders: IOrderAnalytics;
  
  // Quick stats for dashboard cards
  quickStats: {
    todayRevenue: number;
    todayOrders: number;
    todayUsers: number;
    pendingOrders: number;
    lowStockAlerts: number;
    activePromotions: number;
  };
}

// Bulk operations
export interface IBulkProductOperation {
  productIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'updateCategory' | 'updatePrice';
  data?: {
    isActive?: boolean;
    categoryId?: string;
    priceMultiplier?: number; // for bulk price updates
    fixedPrice?: number;
  };
}

export interface IBulkOrderOperation {
  orderIds: string[];
  operation: 'updateStatus' | 'cancel' | 'refund';
  data?: {
    status?: string;
    reason?: string;
    refundAmount?: number;
  };
}

// Activity logging
export interface IAdminActivity {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  action: string;
  resource: string; // 'user', 'product', 'order', 'promotion'
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface ISystemSettings {
  _id: Types.ObjectId;
  key: string;
  value: any;
  description: string;
  category: 'general' | 'payment' | 'shipping' | 'email' | 'security';
  isPublic: boolean; // whether this setting can be accessed by non-admin users
  updatedBy: Types.ObjectId;
  updatedAt: Date;
}
