import { Types } from 'mongoose';
export declare class CartService {
    static getCart(userId?: string, sessionId?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods>;
    static addItem(productId: string, quantity: number, variantId?: string, userId?: string, sessionId?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods>;
    static updateItem(itemId: string, quantity: number, userId?: string, sessionId?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods>;
    static removeItem(itemId: string, userId?: string, sessionId?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods>;
    static clearCart(userId?: string, sessionId?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods>;
    static mergeCart(userId: string, guestSessionId: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods>;
    static getCartSummary(userId?: string, sessionId?: string): Promise<{
        totalItems: number;
        subtotal: number;
        itemCount: number;
    }>;
    static validateCartForCheckout(userId?: string, sessionId?: string): Promise<{
        valid: boolean;
        cart: import("mongoose").Document<unknown, {}, import("@/models").ICart> & Omit<import("@/models").ICart & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        }, keyof import("@/models").ICartMethods> & import("@/models").ICartMethods;
        summary: {
            totalItems: number;
            subtotal: number;
            itemCount: number;
        };
    }>;
    static reserveInventory(cartId: string): Promise<any[]>;
    static releaseInventory(reservations: any[]): Promise<void>;
}
//# sourceMappingURL=cartService.d.ts.map