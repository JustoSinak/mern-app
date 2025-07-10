import { Request, Response, NextFunction } from 'express';
export declare const cartController: {
    getCart: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    addItem: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateItem: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    removeItem: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    clearCart: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    mergeCart: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getCartSummary: (req: Request, res: Response, next: NextFunction) => Promise<any>;
};
//# sourceMappingURL=cartController.d.ts.map