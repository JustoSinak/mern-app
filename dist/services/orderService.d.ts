import { Types } from 'mongoose';
import { ICreateOrderRequest, IOrderTracking } from '@/types/order';
export declare class OrderService {
    static createOrder(orderData: ICreateOrderRequest, userId: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IOrder> & Omit<import("@/models").IOrder & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IOrderMethods> & import("@/models").IOrderMethods>;
    static getUserOrders(userId: string, page?: number, limit?: number): Promise<{
        orders: (import("mongoose").FlattenMaps<import("@/models").IOrder> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static getAllOrders(page?: number, limit?: number, status?: string): Promise<{
        orders: (import("mongoose").FlattenMaps<import("@/models").IOrder> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static getOrder(orderId: string, userId?: string): Promise<import("mongoose").FlattenMaps<import("@/models").IOrder> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static updateOrderStatus(orderId: string, status: IOrderTracking['status'], message?: string, trackingNumber?: string, location?: string, adminUserId?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IOrder> & Omit<import("@/models").IOrder & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IOrderMethods> & import("@/models").IOrderMethods>;
    static cancelOrder(orderId: string, userId: string, reason?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IOrder> & Omit<import("@/models").IOrder & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IOrderMethods> & import("@/models").IOrderMethods>;
    static processRefund(orderId: string, amount: number, reason: string, adminUserId: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IOrder> & Omit<import("@/models").IOrder & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IOrderMethods> & import("@/models").IOrderMethods>;
    static getOrderTracking(orderId: string, userId?: string): Promise<{
        orderNumber: string;
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
        trackingNumber: string | undefined;
        estimatedDeliveryDate: Date | undefined;
        actualDeliveryDate: Date | undefined;
        orderTracking: import("mongoose").FlattenMaps<IOrderTracking>[];
        shippingMethod: import("mongoose").FlattenMaps<import("@/models").IShippingMethod>;
    }>;
    static requestReturn(orderId: string, userId: string, reason: string, items?: any[]): Promise<import("mongoose").Document<unknown, {}, import("@/models").IOrder> & Omit<import("@/models").IOrder & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IOrderMethods> & import("@/models").IOrderMethods>;
    static getOrderStatistics(): Promise<{
        totalOrders: number;
        totalRevenue: any;
        statusBreakdown: any[];
    }>;
}
//# sourceMappingURL=orderService.d.ts.map