import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from './logger';

export class PasswordService {
  private static readonly SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  private static readonly MIN_PASSWORD_LENGTH = 6;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      this.validatePassword(password);
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error comparing password:', error);
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): void {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      throw new Error(`Password must not exceed ${this.MAX_PASSWORD_LENGTH} characters`);
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too common. Please choose a stronger password');
    }
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate password reset token
   */
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash reset token for storage
   */
  static hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate email verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash verification token for storage
   */
  static hashVerificationToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Check password strength score (0-4)
   */
  static getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Use at least 8 characters');

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else feedback.push('Use both uppercase and lowercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Include at least one number');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else feedback.push('Include at least one special character');

    if (password.length >= 12) score++;
    else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');

    // Deduct points for common patterns
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

  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate API key
   */
  static generateApiKey(): string {
    const prefix = 'sk_';
    const randomPart = crypto.randomBytes(24).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return prefix + randomPart;
  }
}
