"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
class JWTService {
    static generateAccessToken(payload) {
        try {
            return jwt.sign(payload, this.JWT_SECRET, {
                expiresIn: this.JWT_EXPIRE,
                issuer: 'shopphere',
                audience: 'shopphere-users'
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating access token:', error);
            throw new Error('Failed to generate access token');
        }
    }
    static generateRefreshToken(userId) {
        try {
            const tokenId = crypto_1.default.randomUUID();
            const payload = {
                userId,
                tokenId
            };
            const token = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
                expiresIn: this.JWT_REFRESH_EXPIRE,
                issuer: 'shopphere',
                audience: 'shopphere-refresh'
            });
            return { token, tokenId };
        }
        catch (error) {
            logger_1.logger.error('Error generating refresh token:', error);
            throw new Error('Failed to generate refresh token');
        }
    }
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET, {
                issuer: 'shopphere',
                audience: 'shopphere-users'
            });
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Access token expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            else {
                logger_1.logger.error('Error verifying access token:', error);
                throw new Error('Token verification failed');
            }
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.JWT_REFRESH_SECRET, {
                issuer: 'shopphere',
                audience: 'shopphere-refresh'
            });
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            else {
                logger_1.logger.error('Error verifying refresh token:', error);
                throw new Error('Refresh token verification failed');
            }
        }
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader)
            return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1] || null;
    }
    static generateTokenPair(userId, email, role) {
        const accessToken = this.generateAccessToken({ userId, email, role });
        const { token: refreshToken, tokenId } = this.generateRefreshToken(userId);
        return {
            accessToken,
            refreshToken,
            tokenId,
            expiresIn: this.JWT_EXPIRE
        };
    }
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        }
        catch (error) {
            logger_1.logger.error('Error decoding token:', error);
            return null;
        }
    }
    static isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp)
                return true;
            return Date.now() >= decoded.exp * 1000;
        }
        catch (error) {
            return true;
        }
    }
    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp)
                return null;
            return new Date(decoded.exp * 1000);
        }
        catch (error) {
            return null;
        }
    }
}
exports.JWTService = JWTService;
JWTService.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
JWTService.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
JWTService.JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
JWTService.JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
//# sourceMappingURL=jwt.js.map