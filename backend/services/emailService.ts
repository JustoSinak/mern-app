import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  /**
   * Initialize email transporter
   */
  static initialize(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Email service initialization failed:', error);
      } else {
        logger.info('Email service initialized successfully');
      }
    });
  }

  /**
   * Send email verification
   */
  static async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string
  ): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopphere.com',
        to: email,
        subject: 'Verify Your Email Address - ShopSphere',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to ShopSphere, ${firstName}!</h2>
            <p>Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
            
            <p style="color: #666; font-size: 14px;">
              This verification link will expire in 24 hours. If you didn't create an account with ShopSphere, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ShopSphere. All rights reserved.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string
  ): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopphere.com',
        to: email,
        subject: 'Reset Your Password - ShopSphere',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your password for your ShopSphere account. Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
            
            <p style="color: #666; font-size: 14px;">
              This password reset link will expire in 10 minutes for security reasons. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ShopSphere. All rights reserved.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopphere.com',
        to: email,
        subject: 'Welcome to ShopSphere!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to ShopSphere, ${firstName}!</h2>
            <p>Your email has been successfully verified and your account is now active.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Browse our extensive product catalog</li>
              <li>Add items to your wishlist</li>
              <li>Enjoy secure checkout</li>
              <li>Track your orders</li>
              <li>Manage your account preferences</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Start Shopping
              </a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ShopSphere. All rights reserved.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email as it's not critical
    }
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmationEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    orderTotal: number
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopphere.com',
        to: email,
        subject: `Order Confirmation - ${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Order Confirmation</h2>
            <p>Hello ${firstName},</p>
            <p>Thank you for your order! We've received your order and it's being processed.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Order Details</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Total Amount:</strong> $${orderTotal.toFixed(2)}</p>
            </div>
            
            <p>You'll receive another email with tracking information once your order ships.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/orders/${orderNumber}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Track Your Order
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ShopSphere. All rights reserved.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Order confirmation email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send order confirmation email:', error);
      // Don't throw error as order is already created
    }
  }

  /**
   * Send generic email
   */
  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopphere.com',
        to,
        subject,
        html,
        text
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to: ${to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
}

// Initialize email service
EmailService.initialize();
