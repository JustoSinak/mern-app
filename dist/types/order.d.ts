import { Document, Types } from 'mongoose';
import { IAddress } from './user';
export interface IOrderItem {
    _id?: Types.ObjectId;
    productId: Types.ObjectId;
    productName: string;
    productImage: string;
    sku: string;
    variantId?: Types.ObjectId;
    variantName?: string;
    quantity: number;
    price: number;
    totalPrice: number;
}
export interface IShippingMethod {
    id: string;
    name: string;
    description?: string;
    price: number;
    estimatedDays: number;
    trackingAvailable: boolean;
}
export interface IPaymentDetails {
    method: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
    transactionId: string;
    paymentIntentId?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    amount: number;
    currency: string;
    paidAt?: Date;
    refundedAmount?: number;
    refundedAt?: Date;
}
export interface IOrderTracking {
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    message: string;
    timestamp: Date;
    location?: string;
}
export interface IOrder extends Document {
    _id: Types.ObjectId;
    orderNumber: string;
    userId: Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    shippingAddress: IAddress;
    billingAddress: IAddress;
    shippingMethod: IShippingMethod;
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    paymentDetails: IPaymentDetails;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    orderTracking: IOrderTracking[];
    customerNotes?: string;
    internalNotes?: string;
    couponCode?: string;
    couponDiscount?: number;
    returnRequested: boolean;
    returnReason?: string;
    returnStatus?: 'pending' | 'approved' | 'rejected' | 'completed';
    returnRequestedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
}
export interface IOrderMethods {
    calculateTotals(): void;
    addTrackingUpdate(status: IOrderTracking['status'], message: string, location?: string): void;
    canBeCancelled(): boolean;
    canBeReturned(): boolean;
    generateOrderNumber(): string;
}
export type OrderModel = IOrder & IOrderMethods;
export interface ICartItem {
    _id?: Types.ObjectId;
    productId: Types.ObjectId;
    variantId?: Types.ObjectId;
    quantity: number;
    addedAt: Date;
}
export interface ICart extends Document {
    _id: Types.ObjectId;
    userId?: Types.ObjectId;
    sessionId?: string;
    items: ICartItem[];
    subtotal: number;
    totalItems: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}
export interface ICartMethods {
    addItem(productId: Types.ObjectId, quantity: number, variantId?: Types.ObjectId): Promise<void>;
    updateItem(itemId: Types.ObjectId, quantity: number): Promise<void>;
    removeItem(itemId: Types.ObjectId): Promise<void>;
    clear(): Promise<void>;
    calculateTotals(): Promise<void>;
    mergeCarts(guestCart: ICart): Promise<void>;
}
export type CartModel = ICart & ICartMethods;
export interface IOrderResponse {
    _id: string;
    orderNumber: string;
    status: string;
    items: IOrderItem[];
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    shippingAddress: IAddress;
    paymentDetails: Omit<IPaymentDetails, 'transactionId' | 'paymentIntentId'>;
    estimatedDeliveryDate?: Date;
    trackingNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IOrderDetailResponse extends IOrderResponse {
    billingAddress: IAddress;
    shippingMethod: IShippingMethod;
    orderTracking: IOrderTracking[];
    customerNotes?: string;
    couponCode?: string;
    returnRequested: boolean;
    returnStatus?: string;
}
export interface ICartResponse {
    _id: string;
    items: Array<ICartItem & {
        product: {
            _id: string;
            name: string;
            price: number;
            image: string;
            inventory: number;
        };
        variant?: {
            _id: string;
            name: string;
            value: string;
            price?: number;
        };
    }>;
    subtotal: number;
    totalItems: number;
    updatedAt: Date;
}
export interface ICreateOrderRequest {
    items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
    }>;
    shippingAddress: Omit<IAddress, '_id'>;
    billingAddress: Omit<IAddress, '_id'>;
    shippingMethod: IShippingMethod;
    paymentMethodId: string;
    customerNotes?: string;
    couponCode?: string;
}
export interface IUpdateOrderStatusRequest {
    status: IOrder['status'];
    message?: string;
    trackingNumber?: string;
    location?: string;
}
export interface IAddToCartRequest {
    productId: string;
    quantity: number;
    variantId?: string;
}
export interface IUpdateCartItemRequest {
    quantity: number;
}
export interface IReturnOrderRequest {
    reason: string;
    items?: Array<{
        itemId: string;
        quantity: number;
        reason: string;
    }>;
}
//# sourceMappingURL=order.d.ts.map