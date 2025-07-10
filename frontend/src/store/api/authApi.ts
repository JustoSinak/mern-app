import { api } from '../api';
import { User } from '../slices/authSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Cart'],
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    getCurrentUser: builder.query<{ success: boolean; data: User }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    forgotPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string }
    >({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<
      { success: boolean; message: string },
      { token: string; password: string; confirmPassword: string }
    >({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    changePassword: builder.mutation<
      { success: boolean; message: string },
      { currentPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),
    verifyEmail: builder.mutation<
      { success: boolean; message: string },
      { token: string }
    >({
      query: ({ token }) => ({
        url: `/auth/verify-email/${token}`,
        method: 'GET',
      }),
    }),
    resendVerification: builder.mutation<
      { success: boolean; message: string },
      void
    >({
      query: () => ({
        url: '/auth/resend-verification',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
