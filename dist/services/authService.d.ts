import { IRegisterRequest, ILoginRequest, IUser } from '@/types/user';
export declare class AuthService {
    static register(userData: IRegisterRequest): Promise<{
        user: IUser;
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: string;
        };
    }>;
    static login(loginData: ILoginRequest, userAgent?: string, ipAddress?: string): Promise<{
        user: IUser;
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: string;
        };
    }>;
    static refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    static logout(userId: string, refreshToken: string): Promise<void>;
    static logoutAll(userId: string): Promise<void>;
    static forgotPassword(email: string): Promise<void>;
    static resetPassword(token: string, newPassword: string): Promise<void>;
    static verifyEmail(token: string): Promise<void>;
    static resendVerification(email: string): Promise<void>;
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=authService.d.ts.map