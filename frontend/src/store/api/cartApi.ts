import { api } from '../api';
import { Cart } from '../slices/cartSlice';

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variantId?: string;
}

export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<{ success: boolean; data: Cart }, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<
      { success: boolean; data: Cart; message: string },
      AddToCartRequest
    >({
      query: (item) => ({
        url: '/cart/items',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<
      { success: boolean; data: Cart; message: string },
      { itemId: string; quantity: number }
    >({
      query: ({ itemId, quantity }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation<
      { success: boolean; data: Cart; message: string },
      string
    >({
      query: (itemId) => ({
        url: `/cart/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<
      { success: boolean; data: Cart; message: string },
      void
    >({
      query: () => ({
        url: '/cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    getCartSummary: builder.query<
      {
        success: boolean;
        data: {
          totalItems: number;
          subtotal: number;
          itemCount: number;
        };
      },
      void
    >({
      query: () => '/cart/summary',
      providesTags: ['Cart'],
    }),
    mergeCart: builder.mutation<
      { success: boolean; data: Cart; message: string },
      { sessionId: string }
    >({
      query: (data) => ({
        url: '/cart/merge',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useGetCartSummaryQuery,
  useMergeCartMutation,
} = cartApi;
