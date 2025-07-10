import { ICreateProductRequest, IUpdateProductRequest, IProductSearchQuery, IAddReviewRequest } from '@/types/product';
import { Types } from 'mongoose';
export declare class ProductService {
    static getProducts(query: IProductSearchQuery): Promise<{
        products: (import("mongoose").FlattenMaps<import("@/models").IProduct> & Required<{
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
    static getProduct(identifier: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IProduct> & Omit<import("@/models").IProduct & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IProductMethods> & import("@/models").IProductMethods>;
    static createProduct(productData: ICreateProductRequest, userId: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IProduct> & Omit<import("@/models").IProduct & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IProductMethods> & import("@/models").IProductMethods>;
    static updateProduct(productId: string, updateData: IUpdateProductRequest, userId: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IProduct> & Omit<import("@/models").IProduct & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IProductMethods> & import("@/models").IProductMethods>;
    static deleteProduct(productId: string, userId: string): Promise<{
        message: string;
    }>;
    static addReview(productId: string, reviewData: IAddReviewRequest, userId: string, userName: string, userAvatar?: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IProduct> & Omit<import("@/models").IProduct & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IProductMethods> & import("@/models").IProductMethods>;
    static updateInventory(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set', userId: string): Promise<import("mongoose").Document<unknown, {}, import("@/models").IProduct> & Omit<import("@/models").IProduct & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, keyof import("@/models").IProductMethods> & import("@/models").IProductMethods>;
    static getFeaturedProducts(limit?: number): Promise<(import("mongoose").FlattenMaps<import("@/models").IProduct> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getCategories(): Promise<(import("mongoose").FlattenMaps<import("@/models").ICategory> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static searchProducts(searchQuery: string, filters?: any): Promise<any[]>;
}
//# sourceMappingURL=productService.d.ts.map