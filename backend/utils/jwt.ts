import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IJwtPayload, IRefreshTokenPayload } from '@/types/common';
import { logger } from './logger';

export class JWTService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  private static readonly JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
  private static readonly JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<IJwtPayload, 'iat' | 'exp'>): string {
    try {
      return (jwt as any).sign(
        payload,
        this.JWT_SECRET,
        {
          expiresIn: this.JWT_EXPIRE,
          issuer: 'shopphere',
          audience: 'shopphere-users'
        }
      );
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string): { token: string; tokenId: string } {
    try {
      const tokenId = crypto.randomUUID();
      const payload: Omit<IRefreshTokenPayload, 'iat' | 'exp'> = {
        userId,
        tokenId
      };

      const token = (jwt as any).sign(
        payload,
        this.JWT_REFRESH_SECRET,
        {
          expiresIn: this.JWT_REFRESH_EXPIRE,
          issuer: 'shopphere',
          audience: 'shopphere-refresh'
        }
      );

      return { token, tokenId };
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'shopphere',
        audience: 'shopphere-users'
      }) as IJwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        logger.error('Error verifying access token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): IRefreshTokenPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'shopphere',
        audience: 'shopphere-refresh'
      }) as IRefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
        throw new Error('Refresh token verification failed');
      }
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(userId: string, email: string, role: string) {
    const accessToken = this.generateAccessToken({ userId, email, role });
    const { token: refreshToken, tokenId } = this.generateRefreshToken(userId);
    
    return {
      accessToken,
      refreshToken,
      tokenId,
      expiresIn: this.JWT_EXPIRE
    };
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}
