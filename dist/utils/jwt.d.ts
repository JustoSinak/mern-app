import { IJwtPayload, IRefreshTokenPayload } from '@/types/common';
export declare class JWTService {
    private static readonly JWT_SECRET;
    private static readonly JWT_REFRESH_SECRET;
    private static readonly JWT_EXPIRE;
    private static readonly JWT_REFRESH_EXPIRE;
    static generateAccessToken(payload: Omit<IJwtPayload, 'iat' | 'exp'>): string;
    static generateRefreshToken(userId: string): {
        token: string;
        tokenId: string;
    };
    static verifyAccessToken(token: string): IJwtPayload;
    static verifyRefreshToken(token: string): IRefreshTokenPayload;
    static extractTokenFromHeader(authHeader: string | undefined): string | null;
    static generateTokenPair(userId: string, email: string, role: string): {
        accessToken: string;
        refreshToken: string;
        tokenId: string;
        expiresIn: string;
    };
    static decodeToken(token: string): any;
    static isTokenExpired(token: string): boolean;
    static getTokenExpiration(token: string): Date | null;
}
//# sourceMappingURL=jwt.d.ts.map