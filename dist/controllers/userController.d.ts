import { Request, Response, NextFunction } from 'express';
export declare const userController: {
    getProfile: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    deleteAccount: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getUserOrders: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getWishlist: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    addToWishlist: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    removeFromWishlist: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getAddresses: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    addAddress: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateAddress: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    deleteAddress: (req: Request, res: Response, next: NextFunction) => Promise<any>;
};
//# sourceMappingURL=userController.d.ts.map