import { Document, Types } from 'mongoose';
export interface IProductImage {
    url: string;
    alt: string;
    isPrimary: boolean;
    publicId?: string;
}
export interface IProductVariant {
    _id?: Types.ObjectId;
    name: string;
    value: string;
    price?: number;
    inventory: number;
    sku?: string;
    isActive: boolean;
}
export interface IProductReview {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    userName: string;
    userAvatar?: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    helpfulVotes: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProductSpecification {
    name: string;
    value: string;
    group?: string;
}
export interface IProduct extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    inventory: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
    sku: string;
    barcode?: string;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: 'cm' | 'in';
    };
    category: Types.ObjectId;
    subcategory?: Types.ObjectId;
    brand?: string;
    tags: string[];
    images: IProductImage[];
    videos?: string[];
    variants: IProductVariant[];
    hasVariants: boolean;
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
    reviews: IProductReview[];
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    specifications: IProductSpecification[];
    status: 'draft' | 'active' | 'inactive' | 'archived';
    isVisible: boolean;
    isFeatured: boolean;
    requiresShipping: boolean;
    shippingClass?: string;
    isDigital: boolean;
    downloadUrl?: string;
    downloadLimit?: number;
    totalSales: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}
export interface IProductMethods {
    updateAverageRating(): Promise<void>;
    addReview(review: Omit<IProductReview, '_id' | 'createdAt' | 'updatedAt'>): Promise<void>;
    updateInventory(quantity: number, operation: 'add' | 'subtract'): Promise<void>;
    isInStock(quantity?: number): boolean;
    getVariantBySku(sku: string): IProductVariant | undefined;
}
export type ProductModel = IProduct & IProductMethods;
export interface ICategory extends Document {
    _id: Types.ObjectId;
    name: string;
    description?: string;
    slug: string;
    image?: string;
    parentCategory?: Types.ObjectId;
    isActive: boolean;
    sortOrder: number;
    metaTitle?: string;
    metaDescription?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProductResponse {
    _id: string;
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    inventory: number;
    sku: string;
    category: string | ICategory;
    brand?: string;
    tags: string[];
    images: IProductImage[];
    slug: string;
    averageRating: number;
    totalReviews: number;
    status: string;
    isFeatured: boolean;
    isInStock: boolean;
    createdAt: Date;
}
export interface IProductDetailResponse extends IProductResponse {
    specifications: IProductSpecification[];
    variants: IProductVariant[];
    reviews: IProductReview[];
    ratingDistribution: IProduct['ratingDistribution'];
    viewCount: number;
    dimensions?: IProduct['dimensions'];
    weight?: number;
}
export interface ICreateProductRequest {
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    inventory: number;
    sku: string;
    category: string;
    brand?: string;
    tags?: string[];
    specifications?: IProductSpecification[];
    variants?: Omit<IProductVariant, '_id'>[];
    requiresShipping?: boolean;
    weight?: number;
    dimensions?: IProduct['dimensions'];
}
export interface IUpdateProductRequest extends Partial<ICreateProductRequest> {
    status?: 'draft' | 'active' | 'inactive' | 'archived';
    isFeatured?: boolean;
}
export interface IProductSearchQuery {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    featured?: boolean;
    sortBy?: 'name' | 'price' | 'rating' | 'created' | 'sales';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface IAddReviewRequest {
    rating: number;
    title: string;
    comment: string;
    images?: string[];
}
//# sourceMappingURL=product.d.ts.map