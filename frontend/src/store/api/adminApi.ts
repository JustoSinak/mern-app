import { api } from '../api';

// Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  orderStats?: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
}

export interface UserSearchQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin' | 'moderator';
  isActive?: boolean;
  isEmailVerified?: boolean;
  sortBy?: 'createdAt' | 'lastLogin' | 'firstName' | 'email';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'updateRole';
  data?: {
    role?: 'user' | 'admin' | 'moderator';
    isActive?: boolean;
  };
}

export interface Promotion {
  _id: string;
  name: string;
  description: string;
  code: string;
  type: 'percentage' | 'fixed' | 'buy_one_get_one' | 'free_shipping';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  currentUsage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionRequest {
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

export interface DashboardStats {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userRetentionRate: number;
  };
  products: {
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
  };
  orders: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  quickStats: {
    todayRevenue: number;
    todayOrders: number;
    todayUsers: number;
    pendingOrders: number;
    lowStockAlerts: number;
    activePromotions: number;
  };
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ============ USER MANAGEMENT ============
    getUsers: builder.query<
      { data: User[]; pagination: any },
      UserSearchQuery
    >({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['AdminUser'],
    }),

    getUserById: builder.query<{ data: User }, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminUser', id }],
    }),

    updateUser: builder.mutation<
      { data: User },
      { id: string; data: Partial<User> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminUser', id },
        'AdminUser',
      ],
    }),

    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUser'],
    }),

    bulkUserOperation: builder.mutation<
      { message: string; affectedCount: number },
      BulkUserOperation
    >({
      query: (operation) => ({
        url: '/admin/users/bulk',
        method: 'POST',
        body: operation,
      }),
      invalidatesTags: ['AdminUser'],
    }),

    getUserStats: builder.query<{ data: any }, void>({
      query: () => '/admin/users/stats',
      providesTags: ['AdminUser'],
    }),

    searchUsers: builder.query<{ data: User[] }, { q: string; limit?: number }>({
      query: (params) => ({
        url: '/admin/users/search',
        params,
      }),
    }),

    // ============ PRODUCT MANAGEMENT ============
    getAdminProducts: builder.query<
      { data: any[]; pagination: any },
      any
    >({
      query: (params) => ({
        url: '/admin/products',
        params,
      }),
      providesTags: ['AdminProduct'],
    }),

    bulkProductOperation: builder.mutation<
      { message: string; affectedCount: number },
      any
    >({
      query: (operation) => ({
        url: '/admin/products/bulk',
        method: 'POST',
        body: operation,
      }),
      invalidatesTags: ['AdminProduct'],
    }),

    updateProductInventory: builder.mutation<
      { data: any },
      { id: string; quantity: number; operation: 'set' | 'add' | 'subtract' }
    >({
      query: ({ id, ...data }) => ({
        url: `/admin/products/${id}/inventory`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminProduct', id },
        'AdminProduct',
      ],
    }),

    getLowStockProducts: builder.query<{ data: any[] }, { threshold?: number }>({
      query: (params) => ({
        url: '/admin/products/low-stock',
        params,
      }),
      providesTags: ['AdminProduct'],
    }),

    getOutOfStockProducts: builder.query<{ data: any[] }, void>({
      query: () => '/admin/products/out-of-stock',
      providesTags: ['AdminProduct'],
    }),

    getProductPerformance: builder.query<
      { data: any },
      { id: string; days?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/admin/products/${id}/performance`,
        params,
      }),
    }),

    importProducts: builder.mutation<
      { data: { success: number; failed: number; errors: string[] } },
      { csvData: any[] }
    >({
      query: (data) => ({
        url: '/admin/products/import',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminProduct'],
    }),

    exportProducts: builder.query<{ data: any[] }, any>({
      query: (params) => ({
        url: '/admin/products/export',
        params,
      }),
    }),

    // ============ PROMOTION MANAGEMENT ============
    getPromotions: builder.query<
      { data: Promotion[]; pagination: any },
      any
    >({
      query: (params) => ({
        url: '/admin/promotions',
        params,
      }),
      providesTags: ['Promotion'],
    }),

    createPromotion: builder.mutation<
      { data: Promotion },
      CreatePromotionRequest
    >({
      query: (data) => ({
        url: '/admin/promotions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Promotion'],
    }),

    getPromotionById: builder.query<{ data: Promotion }, string>({
      query: (id) => `/admin/promotions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Promotion', id }],
    }),

    updatePromotion: builder.mutation<
      { data: Promotion },
      { id: string; data: Partial<CreatePromotionRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/promotions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Promotion', id },
        'Promotion',
      ],
    }),

    deletePromotion: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/promotions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Promotion'],
    }),

    // ============ ANALYTICS ============
    getDashboardStats: builder.query<{ data: DashboardStats }, void>({
      query: () => '/admin/analytics/dashboard',
      providesTags: ['Analytics'],
    }),

    getSalesAnalytics: builder.query<{ data: any }, { days?: number }>({
      query: (params) => ({
        url: '/admin/analytics/sales',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    getUserAnalytics: builder.query<{ data: any }, { days?: number }>({
      query: (params) => ({
        url: '/admin/analytics/users',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    getProductAnalytics: builder.query<{ data: any }, void>({
      query: () => '/admin/analytics/products',
      providesTags: ['Analytics'],
    }),

    getOrderAnalytics: builder.query<{ data: any }, { days?: number }>({
      query: (params) => ({
        url: '/admin/analytics/orders',
        params,
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  // User management
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useBulkUserOperationMutation,
  useGetUserStatsQuery,
  useSearchUsersQuery,

  // Product management
  useGetAdminProductsQuery,
  useBulkProductOperationMutation,
  useUpdateProductInventoryMutation,
  useGetLowStockProductsQuery,
  useGetOutOfStockProductsQuery,
  useGetProductPerformanceQuery,
  useImportProductsMutation,
  useExportProductsQuery,

  // Promotion management
  useGetPromotionsQuery,
  useCreatePromotionMutation,
  useGetPromotionByIdQuery,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,

  // Analytics
  useGetDashboardStatsQuery,
  useGetSalesAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetProductAnalyticsQuery,
  useGetOrderAnalyticsQuery,
} = adminApi;
