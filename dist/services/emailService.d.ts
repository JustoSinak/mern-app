export declare class EmailService {
    private static transporter;
    static initialize(): void;
    static sendVerificationEmail(email: string, token: string, firstName: string): Promise<void>;
    static sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void>;
    static sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    static sendOrderConfirmationEmail(email: string, firstName: string, orderNumber: string, orderTotal: number): Promise<void>;
    static sendEmail(to: string, subject: string, html: string, text?: string): Promise<void>;
}
//# sourceMappingURL=emailService.d.ts.map