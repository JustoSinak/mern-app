export declare class PasswordService {
    private static readonly SALT_ROUNDS;
    private static readonly MIN_PASSWORD_LENGTH;
    private static readonly MAX_PASSWORD_LENGTH;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static validatePassword(password: string): void;
    static generateSecurePassword(length?: number): string;
    static generateResetToken(): string;
    static hashResetToken(token: string): string;
    static generateVerificationToken(): string;
    static hashVerificationToken(token: string): string;
    static getPasswordStrength(password: string): {
        score: number;
        feedback: string[];
    };
    static generateSessionId(): string;
    static generateApiKey(): string;
}
//# sourceMappingURL=password.d.ts.map