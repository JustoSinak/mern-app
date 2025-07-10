import { Request } from 'express';
import { IUser } from './user';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Pagination query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search and filter base interface
export interface BaseSearchQuery extends PaginationQuery {
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

// File upload interface
export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Notification interface
export interface INotification {
  _id?: string;
  userId: string;
  type: 'order' | 'product' | 'account' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Analytics interfaces
export interface IAnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface IProductAnalytics {
  productId: string;
  views: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  period: 'day' | 'week' | 'month' | 'year';
  date: Date;
}

// Error types
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR'
}

// JWT payload interface
export interface IJwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Refresh token payload
export interface IRefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

// Email template data
export interface IEmailTemplate {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Webhook interfaces
export interface IWebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  source: 'stripe' | 'paypal' | 'internal';
}

// Cache interfaces
export interface ICacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
}

// Database query options
export interface IQueryOptions {
  populate?: string | string[];
  select?: string;
  sort?: string | Record<string, 1 | -1>;
  lean?: boolean;
}

// Audit log interface
export interface IAuditLog {
  _id?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Feature flag interface
export interface IFeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: {
    userRole?: string[];
    userIds?: string[];
    percentage?: number;
  };
}

// Rate limiting interface
export interface IRateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Health check interface
export interface IHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
    external: Record<string, 'connected' | 'disconnected' | 'error'>;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

// Configuration interface
export interface IAppConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  redisUrl?: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;
  frontendUrl: string;
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    facebook: {
      appId: string;
      appSecret: string;
    };
  };
  rateLimit: IRateLimitConfig;
}
