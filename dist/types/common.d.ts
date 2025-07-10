import { Request } from 'express';
import { IUser } from './user';
export interface AuthenticatedRequest extends Request {
    user?: IUser;
}
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
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface BaseSearchQuery extends PaginationQuery {
    search?: string;
    startDate?: Date;
    endDate?: Date;
}
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
export declare enum ErrorCodes {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
    INSUFFICIENT_INVENTORY = "INSUFFICIENT_INVENTORY",
    PAYMENT_ERROR = "PAYMENT_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    SERVER_ERROR = "SERVER_ERROR"
}
export interface IJwtPayload {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export interface IRefreshTokenPayload {
    userId: string;
    tokenId: string;
    iat: number;
    exp: number;
}
export interface IEmailTemplate {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
}
export interface IWebhookEvent {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: Date;
    source: 'stripe' | 'paypal' | 'internal';
}
export interface ICacheOptions {
    ttl?: number;
    tags?: string[];
}
export interface IQueryOptions {
    populate?: string | string[];
    select?: string;
    sort?: string | Record<string, 1 | -1>;
    lean?: boolean;
}
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
export interface IRateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
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
//# sourceMappingURL=common.d.ts.map