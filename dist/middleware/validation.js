"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateCart = exports.validateOrder = exports.validateProduct = exports.validateUser = exports.validateAuth = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const password_1 = require("@/utils/password");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().reduce((acc, error) => {
            const field = 'param' in error ? error.param : 'field';
            acc[field] = error.msg;
            return acc;
        }, {});
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
const commonValidations = {
    email: (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email must not exceed 255 characters'),
    password: (0, express_validator_1.body)('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .custom((value) => {
        try {
            password_1.PasswordService.validatePassword(value);
            return true;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
    firstName: (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    phone: (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    mongoId: (field) => (0, express_validator_1.param)(field)
        .isMongoId()
        .withMessage(`Invalid ${field} format`)
};
exports.validateAuth = {
    register: [
        commonValidations.firstName,
        commonValidations.lastName,
        commonValidations.email,
        commonValidations.password,
        commonValidations.phone,
        (0, express_validator_1.body)('dateOfBirth')
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
        (0, express_validator_1.body)('gender')
            .optional()
            .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
            .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
        exports.handleValidationErrors
    ],
    login: [
        commonValidations.email,
        (0, express_validator_1.body)('password')
            .notEmpty()
            .withMessage('Password is required'),
        (0, express_validator_1.body)('rememberMe')
            .optional()
            .isBoolean()
            .withMessage('Remember me must be a boolean'),
        exports.handleValidationErrors
    ],
    forgotPassword: [
        commonValidations.email,
        exports.handleValidationErrors
    ],
    resetPassword: [
        (0, express_validator_1.body)('token')
            .notEmpty()
            .withMessage('Reset token is required')
            .isLength({ min: 64, max: 64 })
            .withMessage('Invalid reset token format'),
        commonValidations.password,
        exports.handleValidationErrors
    ],
    changePassword: [
        (0, express_validator_1.body)('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        commonValidations.password.withMessage('New password must meet security requirements'),
        (0, express_validator_1.body)('confirmPassword')
            .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        }),
        exports.handleValidationErrors
    ],
    verifyEmail: [
        (0, express_validator_1.param)('token')
            .notEmpty()
            .withMessage('Verification token is required')
            .isLength({ min: 64, max: 64 })
            .withMessage('Invalid verification token format'),
        exports.handleValidationErrors
    ]
};
exports.validateUser = {
    updateProfile: [
        (0, express_validator_1.body)('firstName')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('lastName')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be between 1 and 50 characters'),
        commonValidations.phone,
        (0, express_validator_1.body)('dateOfBirth')
            .optional()
            .isISO8601()
            .withMessage('Date of birth must be a valid date'),
        (0, express_validator_1.body)('gender')
            .optional()
            .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
            .withMessage('Invalid gender value'),
        (0, express_validator_1.body)('preferences.newsletter')
            .optional()
            .isBoolean()
            .withMessage('Newsletter preference must be a boolean'),
        (0, express_validator_1.body)('preferences.smsNotifications')
            .optional()
            .isBoolean()
            .withMessage('SMS notifications preference must be a boolean'),
        (0, express_validator_1.body)('preferences.emailNotifications')
            .optional()
            .isBoolean()
            .withMessage('Email notifications preference must be a boolean'),
        (0, express_validator_1.body)('preferences.currency')
            .optional()
            .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
            .withMessage('Invalid currency'),
        (0, express_validator_1.body)('preferences.language')
            .optional()
            .isIn(['en', 'es', 'fr', 'de', 'it'])
            .withMessage('Invalid language'),
        (0, express_validator_1.body)('preferences.theme')
            .optional()
            .isIn(['light', 'dark', 'auto'])
            .withMessage('Invalid theme'),
        exports.handleValidationErrors
    ],
    address: [
        (0, express_validator_1.body)('type')
            .isIn(['home', 'work', 'other'])
            .withMessage('Address type must be home, work, or other'),
        (0, express_validator_1.body)('firstName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name is required and must not exceed 50 characters'),
        (0, express_validator_1.body)('lastName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name is required and must not exceed 50 characters'),
        (0, express_validator_1.body)('company')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Company name must not exceed 100 characters'),
        (0, express_validator_1.body)('addressLine1')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Address line 1 is required and must not exceed 100 characters'),
        (0, express_validator_1.body)('addressLine2')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Address line 2 must not exceed 100 characters'),
        (0, express_validator_1.body)('city')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('City is required and must not exceed 50 characters'),
        (0, express_validator_1.body)('state')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('State is required and must not exceed 50 characters'),
        (0, express_validator_1.body)('postalCode')
            .trim()
            .isLength({ min: 1, max: 20 })
            .withMessage('Postal code is required and must not exceed 20 characters'),
        (0, express_validator_1.body)('country')
            .trim()
            .isLength({ min: 2, max: 2 })
            .withMessage('Country must be a 2-letter country code'),
        (0, express_validator_1.body)('phone')
            .optional()
            .isMobilePhone('any')
            .withMessage('Please provide a valid phone number'),
        (0, express_validator_1.body)('isDefault')
            .optional()
            .isBoolean()
            .withMessage('isDefault must be a boolean'),
        exports.handleValidationErrors
    ]
};
exports.validateProduct = {
    create: [
        (0, express_validator_1.body)('name')
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Product name is required and must not exceed 200 characters'),
        (0, express_validator_1.body)('description')
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Description is required and must not exceed 5000 characters'),
        (0, express_validator_1.body)('shortDescription')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Short description must not exceed 500 characters'),
        (0, express_validator_1.body)('price')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        (0, express_validator_1.body)('compareAtPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Compare at price must be a positive number'),
        (0, express_validator_1.body)('inventory')
            .isInt({ min: 0 })
            .withMessage('Inventory must be a non-negative integer'),
        (0, express_validator_1.body)('sku')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('SKU is required and must not exceed 50 characters')
            .matches(/^[A-Z0-9-_]+$/)
            .withMessage('SKU can only contain uppercase letters, numbers, hyphens, and underscores'),
        (0, express_validator_1.body)('category')
            .isMongoId()
            .withMessage('Valid category ID is required'),
        (0, express_validator_1.body)('brand')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Brand must not exceed 100 characters'),
        (0, express_validator_1.body)('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        (0, express_validator_1.body)('tags.*')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Each tag must be between 1 and 50 characters'),
        (0, express_validator_1.body)('weight')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Weight must be a positive number'),
        (0, express_validator_1.body)('requiresShipping')
            .optional()
            .isBoolean()
            .withMessage('Requires shipping must be a boolean'),
        exports.handleValidationErrors
    ],
    update: [
        (0, express_validator_1.body)('name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Product name must not exceed 200 characters'),
        (0, express_validator_1.body)('description')
            .optional()
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Description must not exceed 5000 characters'),
        (0, express_validator_1.body)('price')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        (0, express_validator_1.body)('inventory')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Inventory must be a non-negative integer'),
        (0, express_validator_1.body)('status')
            .optional()
            .isIn(['draft', 'active', 'inactive', 'archived'])
            .withMessage('Invalid status'),
        (0, express_validator_1.body)('isFeatured')
            .optional()
            .isBoolean()
            .withMessage('isFeatured must be a boolean'),
        exports.handleValidationErrors
    ],
    review: [
        (0, express_validator_1.body)('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        (0, express_validator_1.body)('title')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Review title is required and must not exceed 100 characters'),
        (0, express_validator_1.body)('comment')
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Review comment is required and must not exceed 1000 characters'),
        (0, express_validator_1.body)('images')
            .optional()
            .isArray({ max: 5 })
            .withMessage('Maximum 5 images allowed'),
        (0, express_validator_1.body)('images.*')
            .optional()
            .isURL()
            .withMessage('Each image must be a valid URL'),
        exports.handleValidationErrors
    ],
    inventory: [
        (0, express_validator_1.body)('quantity')
            .isInt()
            .withMessage('Quantity must be an integer'),
        (0, express_validator_1.body)('operation')
            .isIn(['add', 'subtract', 'set'])
            .withMessage('Operation must be add, subtract, or set'),
        exports.handleValidationErrors
    ],
    search: [
        (0, express_validator_1.query)('q')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Search query must not exceed 100 characters'),
        (0, express_validator_1.query)('category')
            .optional()
            .isMongoId()
            .withMessage('Invalid category ID'),
        (0, express_validator_1.query)('minPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Minimum price must be a positive number'),
        (0, express_validator_1.query)('maxPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Maximum price must be a positive number'),
        (0, express_validator_1.query)('rating')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        (0, express_validator_1.query)('sortBy')
            .optional()
            .isIn(['name', 'price', 'rating', 'created', 'sales'])
            .withMessage('Invalid sort field'),
        (0, express_validator_1.query)('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort order must be asc or desc'),
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        exports.handleValidationErrors
    ]
};
exports.validateOrder = {
    create: [
        (0, express_validator_1.body)('items')
            .isArray({ min: 1 })
            .withMessage('Order must contain at least one item'),
        (0, express_validator_1.body)('items.*.productId')
            .isMongoId()
            .withMessage('Valid product ID is required for each item'),
        (0, express_validator_1.body)('items.*.quantity')
            .isInt({ min: 1 })
            .withMessage('Quantity must be a positive integer'),
        (0, express_validator_1.body)('items.*.variantId')
            .optional()
            .isMongoId()
            .withMessage('Invalid variant ID'),
        (0, express_validator_1.body)('shippingAddress')
            .isObject()
            .withMessage('Shipping address is required'),
        (0, express_validator_1.body)('shippingAddress.firstName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Shipping address first name is required'),
        (0, express_validator_1.body)('shippingAddress.lastName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Shipping address last name is required'),
        (0, express_validator_1.body)('shippingAddress.addressLine1')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Shipping address line 1 is required'),
        (0, express_validator_1.body)('shippingAddress.city')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Shipping city is required'),
        (0, express_validator_1.body)('shippingAddress.state')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Shipping state is required'),
        (0, express_validator_1.body)('shippingAddress.postalCode')
            .trim()
            .isLength({ min: 1, max: 20 })
            .withMessage('Shipping postal code is required'),
        (0, express_validator_1.body)('shippingAddress.country')
            .trim()
            .isLength({ min: 2, max: 2 })
            .withMessage('Shipping country must be a 2-letter code'),
        (0, express_validator_1.body)('billingAddress')
            .isObject()
            .withMessage('Billing address is required'),
        (0, express_validator_1.body)('shippingMethod')
            .isObject()
            .withMessage('Shipping method is required'),
        (0, express_validator_1.body)('shippingMethod.id')
            .notEmpty()
            .withMessage('Shipping method ID is required'),
        (0, express_validator_1.body)('paymentMethodId')
            .notEmpty()
            .withMessage('Payment method ID is required'),
        (0, express_validator_1.body)('customerNotes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Customer notes must not exceed 500 characters'),
        exports.handleValidationErrors
    ],
    updateStatus: [
        (0, express_validator_1.body)('status')
            .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
            .withMessage('Invalid order status'),
        (0, express_validator_1.body)('message')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Status message must not exceed 200 characters'),
        (0, express_validator_1.body)('trackingNumber')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Tracking number must not exceed 100 characters'),
        (0, express_validator_1.body)('location')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Location must not exceed 100 characters'),
        exports.handleValidationErrors
    ],
    refund: [
        (0, express_validator_1.body)('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Refund amount must be greater than 0'),
        (0, express_validator_1.body)('reason')
            .trim()
            .isLength({ min: 1, max: 500 })
            .withMessage('Refund reason is required and must not exceed 500 characters'),
        exports.handleValidationErrors
    ],
    return: [
        (0, express_validator_1.body)('reason')
            .trim()
            .isLength({ min: 1, max: 500 })
            .withMessage('Return reason is required and must not exceed 500 characters'),
        (0, express_validator_1.body)('items')
            .optional()
            .isArray()
            .withMessage('Items must be an array'),
        (0, express_validator_1.body)('items.*.itemId')
            .optional()
            .isMongoId()
            .withMessage('Invalid item ID'),
        (0, express_validator_1.body)('items.*.quantity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Return quantity must be a positive integer'),
        (0, express_validator_1.body)('items.*.reason')
            .optional()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Item return reason must not exceed 200 characters'),
        exports.handleValidationErrors
    ]
};
exports.validateCart = {
    addItem: [
        (0, express_validator_1.body)('productId')
            .isMongoId()
            .withMessage('Valid product ID is required'),
        (0, express_validator_1.body)('quantity')
            .isInt({ min: 1, max: 100 })
            .withMessage('Quantity must be between 1 and 100'),
        (0, express_validator_1.body)('variantId')
            .optional()
            .isMongoId()
            .withMessage('Invalid variant ID'),
        exports.handleValidationErrors
    ],
    updateItem: [
        (0, express_validator_1.body)('quantity')
            .isInt({ min: 1, max: 100 })
            .withMessage('Quantity must be between 1 and 100'),
        exports.handleValidationErrors
    ],
    merge: [
        (0, express_validator_1.body)('guestCartId')
            .optional()
            .isMongoId()
            .withMessage('Invalid guest cart ID'),
        (0, express_validator_1.body)('sessionId')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Invalid session ID'),
        exports.handleValidationErrors
    ]
};
exports.validateParams = {
    mongoId: (paramName) => [
        commonValidations.mongoId(paramName),
        exports.handleValidationErrors
    ],
    pagination: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        exports.handleValidationErrors
    ]
};
//# sourceMappingURL=validation.js.map