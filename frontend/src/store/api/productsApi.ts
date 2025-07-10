import { api } from '../api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  brand: string;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  inventory: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  isFeatured: boolean;
  isVisible: boolean;
  status: 'draft' | 'active' | 'archived';
  averageRating: number;
  totalReviews: number;
  totalSales: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProductSearchParams {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  sortBy?: 'price' | 'rating' | 'name' | 'sales' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, ProductSearchParams>({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query<{ success: boolean; data: Product }, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    searchProducts: builder.query<
      { success: boolean; data: Product[] },
      { q: string; [key: string]: any }
    >({
      query: (params) => ({
        url: '/products/search',
        params,
      }),
      providesTags: ['Product'],
    }),
    getCategories: builder.query<{ success: boolean; data: Category[] }, void>({
      query: () => '/products/categories',
      providesTags: ['Category'],
    }),
    getFeaturedProducts: builder.query<
      { success: boolean; data: Product[] },
      { limit?: number }
    >({
      query: (params) => ({
        url: '/products/featured',
        params,
      }),
      providesTags: ['Product'],
    }),
    getRecommendations: builder.query<
      { success: boolean; data: Product[] },
      void
    >({
      query: () => '/products/recommendations',
      providesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useSearchProductsQuery,
  useGetCategoriesQuery,
  useGetFeaturedProductsQuery,
  useGetRecommendationsQuery,
} = productsApi;
