import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAuth: {
    register: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    login: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    forgotPassword: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    resetPassword: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    changePassword: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    verifyEmail: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
};
export declare const validateUser: {
    updateProfile: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    address: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
};
export declare const validateProduct: {
    create: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    update: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    review: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    inventory: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    search: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
};
export declare const validateOrder: {
    create: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    updateStatus: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    refund: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    return: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
};
export declare const validateCart: {
    addItem: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    updateItem: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    merge: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
};
export declare const validateParams: {
    mongoId: (paramName: string) => (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
    pagination: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
};
//# sourceMappingURL=validation.d.ts.map