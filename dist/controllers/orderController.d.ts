import { Request, Response, NextFunction } from 'express';
export declare const orderController: {
    createOrder: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getUserOrders: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getAllOrders: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getOrder: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    updateOrderStatus: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    cancelOrder: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    processRefund: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getOrderTracking: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    requestReturn: (req: Request, res: Response, next: NextFunction) => Promise<any>;
};
//# sourceMappingURL=orderController.d.ts.map