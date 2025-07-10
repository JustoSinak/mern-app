import { Request, Response, NextFunction } from 'express';
export declare const authController: {
    register: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    login: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    logout: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    logoutAll: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    forgotPassword: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    verifyEmail: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    resendVerification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    changePassword: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getProfile: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    googleAuth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    googleCallback: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    facebookAuth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    facebookCallback: (req: Request, res: Response, next: NextFunction) => Promise<any>;
};
//# sourceMappingURL=authController.d.ts.map