import { Request, Response, NextFunction } from 'express';
export declare const paymentController: {
    createPaymentIntent: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    confirmPayment: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    processRefund: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getPaymentStatus: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getPaymentMethods: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    handleWebhook: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    createSetupIntent: (req: Request, res: Response, next: NextFunction) => Promise<any>;
};
//# sourceMappingURL=paymentController.d.ts.map