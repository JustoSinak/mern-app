import { Document, Types } from 'mongoose';

export interface IAddress {
  _id?: Types.ObjectId;
  type: 'home' | 'work' | 'other';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  
  // Authentication
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: IRefreshToken[];
  
  // OAuth
  googleId?: string;
  facebookId?: string;
  
  // Profile
  avatar?: string;
  addresses: IAddress[];
  wishlist: Types.ObjectId[]; // Product IDs
  
  // Account settings
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  
  // Preferences
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  addRefreshToken(token: string, userAgent?: string, ipAddress?: string): void;
  removeRefreshToken(token: string): void;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export type UserModel = IUser & IUserMethods;

// DTOs for API responses (without sensitive data)
export interface IUserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isEmailVerified: boolean;
  addresses: IAddress[];
  preferences: IUser['preferences'];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile extends IUserResponse {
  dateOfBirth?: Date;
  gender?: string;
  wishlist: string[];
  lastLogin?: Date;
}

// Request DTOs
export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  preferences?: Partial<IUser['preferences']>;
}

export interface IAddAddressRequest extends Omit<IAddress, '_id' | 'isDefault'> {
  isDefault?: boolean;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
