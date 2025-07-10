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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const addressSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});
const refreshTokenSchema = new mongoose_1.Schema({
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userAgent: String,
    ipAddress: String
});
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [refreshTokenSchema],
    googleId: String,
    facebookId: String,
    avatar: String,
    addresses: [addressSchema],
    wishlist: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Product'
        }],
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    preferences: {
        newsletter: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        emailNotifications: {
            type: Boolean,
            default: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        language: {
            type: String,
            default: 'en'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.emailVerificationToken;
            delete ret.passwordResetToken;
            delete ret.loginAttempts;
            delete ret.lockUntil;
            return ret;
        }
    }
});
userSchema.index({ email: 1 });
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
        this.password = await bcryptjs_1.default.hash(this.password, saltRounds);
        next();
    }
    catch (error) {
        next(error);
    }
});
userSchema.pre('save', function (next) {
    if (this.isModified('addresses')) {
        const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
        if (defaultAddresses.length > 1) {
            this.addresses.forEach((addr, index) => {
                if (index > 0 && addr.isDefault) {
                    addr.isDefault = false;
                }
            });
        }
    }
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto_1.default.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return token;
};
userSchema.methods.generatePasswordResetToken = function () {
    const token = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return token;
};
userSchema.methods.addRefreshToken = function (token, userAgent, ipAddress) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.refreshTokens.push({
        token,
        expiresAt,
        createdAt: new Date(),
        userAgent: userAgent || '',
        ipAddress: ipAddress || ''
    });
    if (this.refreshTokens.length > 5) {
        this.refreshTokens = this.refreshTokens.slice(-5);
    }
};
userSchema.methods.removeRefreshToken = function (token) {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};
userSchema.methods.incLoginAttempts = async function () {
    if (this.lockUntil && this.lockUntil.getTime() < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    return this.updateOne(updates);
};
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map