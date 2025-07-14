import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler';
import { PasswordService } from '../utils/password';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().reduce((acc, error) => {
      const field = 'param' in error ? (error as any).param : 'field';
      acc[field as string] = error.msg;
      return acc;
    }, {} as Record<string, string>);

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
    return;
  }

  next();
};

/**
 * Common validation rules
 */
const commonValidations = {
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  password: body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .custom((value) => {
      try {
        PasswordService.validatePassword(value);
        return true;
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  firstName: body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  phone: body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  mongoId: (field: string) =>
    param(field)
      .isMongoId()
      .withMessage(`Invalid ${field} format`)
};

/**
 * Authentication validation rules
 */
export const validateAuth = {
  register: [
    commonValidations.firstName,
    commonValidations.lastName,
    commonValidations.email,
    commonValidations.password,
    commonValidations.phone,
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid date')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        if (age < 13 || age > 120) {
          throw new Error('Age must be between 13 and 120 years');
        }
        return true;
      }),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
      .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
    handleValidationErrors
  ],

  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean'),
    handleValidationErrors
  ],

  forgotPassword: [
    commonValidations.email,
    handleValidationErrors
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid reset token format'),
    commonValidations.password,
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password.withMessage('New password must meet security requirements'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
    handleValidationErrors
  ],

  verifyEmail: [
    param('token')
      .notEmpty()
      .withMessage('Verification token is required')
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid verification token format'),
    handleValidationErrors
  ]
};

/**
 * User validation rules
 */
export const validateUser = {
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    commonValidations.phone,
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid date'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
      .withMessage('Invalid gender value'),
    body('preferences.newsletter')
      .optional()
      .isBoolean()
      .withMessage('Newsletter preference must be a boolean'),
    body('preferences.smsNotifications')
      .optional()
      .isBoolean()
      .withMessage('SMS notifications preference must be a boolean'),
    body('preferences.emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('Email notifications preference must be a boolean'),
    body('preferences.currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
      .withMessage('Invalid currency'),
    body('preferences.language')
      .optional()
      .isIn(['en', 'es', 'fr', 'de', 'it'])
      .withMessage('Invalid language'),
    body('preferences.theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Invalid theme'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('New password must be between 6 and 128 characters')
      .custom((value) => {
        try {
          PasswordService.validatePassword(value);
          return true;
        } catch (error) {
          throw new Error((error as Error).message);
        }
      }),
    handleValidationErrors
  ],

  preferences: [
    body('newsletter')
      .optional()
      .isBoolean()
      .withMessage('Newsletter preference must be a boolean'),
    body('smsNotifications')
      .optional()
      .isBoolean()
      .withMessage('SMS notifications preference must be a boolean'),
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('Email notifications preference must be a boolean'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'])
      .withMessage('Invalid currency'),
    body('language')
      .optional()
      .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])
      .withMessage('Invalid language'),
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Invalid theme'),
    handleValidationErrors
  ],

  address: [
    body('type')
      .isIn(['home', 'work', 'other'])
      .withMessage('Address type must be home, work, or other'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must not exceed 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must not exceed 50 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must not exceed 100 characters'),
    body('addressLine1')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Address line 1 is required and must not exceed 100 characters'),
    body('addressLine2')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Address line 2 must not exceed 100 characters'),
    body('city')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('City is required and must not exceed 50 characters'),
    body('state')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('State is required and must not exceed 50 characters'),
    body('postalCode')
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Postal code is required and must not exceed 20 characters'),
    body('country')
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country must be a 2-letter country code'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
    handleValidationErrors
  ]
};

/**
 * Product validation rules
 */
export const validateProduct = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Product name is required and must not exceed 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Description is required and must not exceed 5000 characters'),
    body('shortDescription')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Short description must not exceed 500 characters'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('compareAtPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare at price must be a positive number'),
    body('inventory')
      .isInt({ min: 0 })
      .withMessage('Inventory must be a non-negative integer'),
    body('sku')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('SKU is required and must not exceed 50 characters')
      .matches(/^[A-Z0-9-_]+$/)
      .withMessage('SKU can only contain uppercase letters, numbers, hyphens, and underscores'),
    body('category')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('brand')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Brand must not exceed 100 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('requiresShipping')
      .optional()
      .isBoolean()
      .withMessage('Requires shipping must be a boolean'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Product name must not exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('inventory')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory must be a non-negative integer'),
    body('status')
      .optional()
      .isIn(['draft', 'active', 'inactive', 'archived'])
      .withMessage('Invalid status'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    handleValidationErrors
  ],

  review: [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Review title is required and must not exceed 100 characters'),
    body('comment')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Review comment is required and must not exceed 1000 characters'),
    body('images')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 images allowed'),
    body('images.*')
      .optional()
      .isURL()
      .withMessage('Each image must be a valid URL'),
    handleValidationErrors
  ],

  inventory: [
    body('quantity')
      .isInt()
      .withMessage('Quantity must be an integer'),
    body('operation')
      .isIn(['add', 'subtract', 'set'])
      .withMessage('Operation must be add, subtract, or set'),
    handleValidationErrors
  ],

  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search query must not exceed 100 characters'),
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    query('sortBy')
      .optional()
      .isIn(['name', 'price', 'rating', 'created', 'sales'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ]
};

/**
 * Order validation rules
 */
export const validateOrder = {
  create: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.productId')
      .isMongoId()
      .withMessage('Valid product ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('items.*.variantId')
      .optional()
      .isMongoId()
      .withMessage('Invalid variant ID'),
    body('shippingAddress')
      .isObject()
      .withMessage('Shipping address is required'),
    body('shippingAddress.firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Shipping address first name is required'),
    body('shippingAddress.lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Shipping address last name is required'),
    body('shippingAddress.addressLine1')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Shipping address line 1 is required'),
    body('shippingAddress.city')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Shipping city is required'),
    body('shippingAddress.state')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Shipping state is required'),
    body('shippingAddress.postalCode')
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Shipping postal code is required'),
    body('shippingAddress.country')
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage('Shipping country must be a 2-letter code'),
    body('billingAddress')
      .isObject()
      .withMessage('Billing address is required'),
    body('shippingMethod')
      .isObject()
      .withMessage('Shipping method is required'),
    body('shippingMethod.id')
      .notEmpty()
      .withMessage('Shipping method ID is required'),
    body('paymentMethodId')
      .notEmpty()
      .withMessage('Payment method ID is required'),
    body('customerNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Customer notes must not exceed 500 characters'),
    handleValidationErrors
  ],

  updateStatus: [
    body('status')
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
      .withMessage('Invalid order status'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Status message must not exceed 200 characters'),
    body('trackingNumber')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Tracking number must not exceed 100 characters'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location must not exceed 100 characters'),
    handleValidationErrors
  ],

  refund: [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0'),
    body('reason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Refund reason is required and must not exceed 500 characters'),
    handleValidationErrors
  ],

  return: [
    body('reason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Return reason is required and must not exceed 500 characters'),
    body('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array'),
    body('items.*.itemId')
      .optional()
      .isMongoId()
      .withMessage('Invalid item ID'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Return quantity must be a positive integer'),
    body('items.*.reason')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Item return reason must not exceed 200 characters'),
    handleValidationErrors
  ]
};

/**
 * Cart validation rules
 */
export const validateCart = {
  addItem: [
    body('productId')
      .isMongoId()
      .withMessage('Valid product ID is required'),
    body('quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be between 1 and 100'),
    body('variantId')
      .optional()
      .isMongoId()
      .withMessage('Invalid variant ID'),
    handleValidationErrors
  ],

  updateItem: [
    body('quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be between 1 and 100'),
    handleValidationErrors
  ],

  merge: [
    body('guestCartId')
      .optional()
      .isMongoId()
      .withMessage('Invalid guest cart ID'),
    body('sessionId')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Invalid session ID'),
    handleValidationErrors
  ]
};

/**
 * Common parameter validations
 */
export const validateParams = {
  mongoId: (paramName: string) => [
    commonValidations.mongoId(paramName),
    handleValidationErrors
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ]
};
