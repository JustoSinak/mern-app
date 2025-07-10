"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
class PasswordService {
    static async hashPassword(password) {
        try {
            this.validatePassword(password);
            return await bcryptjs_1.default.hash(password, this.SALT_ROUNDS);
        }
        catch (error) {
            logger_1.logger.error('Error hashing password:', error);
            throw error;
        }
    }
    static async comparePassword(password, hash) {
        try {
            return await bcryptjs_1.default.compare(password, hash);
        }
        catch (error) {
            logger_1.logger.error('Error comparing password:', error);
            return false;
        }
    }
    static validatePassword(password) {
        if (!password) {
            throw new Error('Password is required');
        }
        if (password.length < this.MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
        }
        if (password.length > this.MAX_PASSWORD_LENGTH) {
            throw new Error(`Password must not exceed ${this.MAX_PASSWORD_LENGTH} characters`);
        }
        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }
        if (!/\d/.test(password)) {
            throw new Error('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            throw new Error('Password must contain at least one special character');
        }
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            throw new Error('Password is too common. Please choose a stronger password');
        }
    }
    static generateSecurePassword(length = 16) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';
        password += lowercase[crypto_1.default.randomInt(0, lowercase.length)];
        password += uppercase[crypto_1.default.randomInt(0, uppercase.length)];
        password += numbers[crypto_1.default.randomInt(0, numbers.length)];
        password += symbols[crypto_1.default.randomInt(0, symbols.length)];
        for (let i = 4; i < length; i++) {
            password += allChars[crypto_1.default.randomInt(0, allChars.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    static generateResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static hashResetToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    static generateVerificationToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static hashVerificationToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    static getPasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (password.length >= 8)
            score++;
        else
            feedback.push('Use at least 8 characters');
        if (/[a-z]/.test(password) && /[A-Z]/.test(password))
            score++;
        else
            feedback.push('Use both uppercase and lowercase letters');
        if (/\d/.test(password))
            score++;
        else
            feedback.push('Include at least one number');
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
            score++;
        else
            feedback.push('Include at least one special character');
        if (password.length >= 12)
            score++;
        else if (password.length >= 8)
            feedback.push('Consider using 12+ characters for better security');
        if (/(.)\1{2,}/.test(password)) {
            score = Math.max(0, score - 1);
            feedback.push('Avoid repeating characters');
        }
        if (/123|abc|qwe/i.test(password)) {
            score = Math.max(0, score - 1);
            feedback.push('Avoid common sequences');
        }
        return { score: Math.min(4, score), feedback };
    }
    static generateSessionId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static generateApiKey() {
        const prefix = 'sk_';
        const randomPart = crypto_1.default.randomBytes(24).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        return prefix + randomPart;
    }
}
exports.PasswordService = PasswordService;
PasswordService.SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
PasswordService.MIN_PASSWORD_LENGTH = 6;
PasswordService.MAX_PASSWORD_LENGTH = 128;
//# sourceMappingURL=password.js.map