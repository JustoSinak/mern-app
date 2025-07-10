import Stripe from 'stripe';
export declare class PaymentService {
    private static stripe;
    static initialize(): void;
    static createPaymentIntent(orderId: string, amount: number, currency?: string, metadata?: Record<string, string>): Promise<{
        clientSecret: string | null;
        paymentIntentId: string;
    }>;
    static confirmPayment(paymentIntentId: string): Promise<{
        success: boolean;
        paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
    }>;
    static processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Response<Stripe.Refund>>;
    static handleWebhook(payload: string | Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    private static handlePaymentSucceeded;
    private static handlePaymentFailed;
    private static handleChargeDispute;
    static getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]>;
    static createCustomer(email: string, name: string): Promise<Stripe.Response<Stripe.Customer>>;
    static getPaymentIntentStatus(paymentIntentId: string): Promise<{
        status: Stripe.PaymentIntent.Status;
        amount: number;
        currency: string;
    }>;
}
//# sourceMappingURL=paymentService.d.ts.map