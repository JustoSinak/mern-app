import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images: Array<{ url: string; alt: string }>;
    inventory: number;
    trackInventory: boolean;
  };
  variantId?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  updatedAt: string;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearCart: (state) => {
      state.cart = null;
      state.error = null;
    },
    updateItemQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      if (state.cart) {
        const item = state.cart.items.find(item => item._id === action.payload.itemId);
        if (item) {
          item.quantity = action.payload.quantity;
          item.totalPrice = item.price * action.payload.quantity;
          
          // Recalculate totals
          state.cart.totalItems = state.cart.items.reduce((total, item) => total + item.quantity, 0);
          state.cart.subtotal = state.cart.items.reduce((total, item) => total + item.totalPrice, 0);
        }
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      if (state.cart) {
        state.cart.items = state.cart.items.filter(item => item._id !== action.payload);
        
        // Recalculate totals
        state.cart.totalItems = state.cart.items.reduce((total, item) => total + item.quantity, 0);
        state.cart.subtotal = state.cart.items.reduce((total, item) => total + item.totalPrice, 0);
      }
    },
  },
});

export const {
  setCart,
  setLoading,
  setError,
  clearCart,
  updateItemQuantity,
  removeItem,
} = cartSlice.actions;

export default cartSlice.reducer;
