import { Request, Response, NextFunction } from 'express';
export declare const productController: {
    getProducts: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    searchProducts: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getCategories: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getFeaturedProducts: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getRecommendations: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getProduct: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    createProduct: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateProduct: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    deleteProduct: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    addReview: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateReview: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    deleteReview: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateInventory: (req: Request, res: Response, next: NextFunction) => Promise<any>;
};
//# sourceMappingURL=productController.d.ts.map