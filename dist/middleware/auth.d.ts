import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types/common';
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
export declare const auth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const authorize: (...roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const adminAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const moderatorAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const ownerOrAdmin: (resourceUserIdField?: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map