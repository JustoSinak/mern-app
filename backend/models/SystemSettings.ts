import mongoose, { Schema } from 'mongoose';
import { ISystemSettings } from '../types/admin';

const systemSettingsSchema = new Schema<ISystemSettings>({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Setting key cannot exceed 100 characters'],
    match: [/^[a-z0-9_]+$/, 'Setting key can only contain lowercase letters, numbers, and underscores']
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: [true, 'Setting description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Setting category is required'],
    enum: ['general', 'payment', 'shipping', 'email', 'security', 'analytics', 'notifications'],
    lowercase: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Using custom updatedAt field
});

// Indexes
systemSettingsSchema.index({ key: 1 });
systemSettingsSchema.index({ category: 1 });
systemSettingsSchema.index({ isPublic: 1 });

// Pre-save middleware to update the updatedAt field
systemSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get setting by key
systemSettingsSchema.statics.getSetting = async function(key: string) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

// Static method to set setting value
systemSettingsSchema.statics.setSetting = async function(
  key: string, 
  value: any, 
  updatedBy: string,
  description?: string,
  category?: string
) {
  const updateData: any = {
    value,
    updatedBy,
    updatedAt: new Date()
  };
  
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  
  return this.findOneAndUpdate(
    { key },
    updateData,
    { upsert: true, new: true }
  );
};

// Static method to get public settings (for frontend)
systemSettingsSchema.statics.getPublicSettings = async function() {
  const settings = await this.find({ isPublic: true }).select('key value description category');
  return settings.reduce((acc, setting) => {
    acc[setting.key] = {
      value: setting.value,
      description: setting.description,
      category: setting.category
    };
    return acc;
  }, {} as any);
};

// Static method to get settings by category
systemSettingsSchema.statics.getSettingsByCategory = async function(category: string) {
  return this.find({ category }).sort({ key: 1 });
};

// Static method to initialize default settings
systemSettingsSchema.statics.initializeDefaultSettings = async function(adminUserId: string) {
  const defaultSettings = [
    // General settings
    { key: 'site_name', value: 'ShopSphere', description: 'Website name', category: 'general', isPublic: true },
    { key: 'site_description', value: 'Your one-stop shop for everything', description: 'Website description', category: 'general', isPublic: true },
    { key: 'contact_email', value: 'contact@shopsphere.com', description: 'Contact email address', category: 'general', isPublic: true },
    { key: 'support_phone', value: '+1-800-SHOP-NOW', description: 'Support phone number', category: 'general', isPublic: true },
    { key: 'default_currency', value: 'USD', description: 'Default currency code', category: 'general', isPublic: true },
    { key: 'timezone', value: 'UTC', description: 'Default timezone', category: 'general', isPublic: false },
    
    // Payment settings
    { key: 'payment_methods', value: ['stripe', 'paypal'], description: 'Enabled payment methods', category: 'payment', isPublic: true },
    { key: 'stripe_publishable_key', value: '', description: 'Stripe publishable key', category: 'payment', isPublic: true },
    { key: 'stripe_webhook_secret', value: '', description: 'Stripe webhook secret', category: 'payment', isPublic: false },
    { key: 'paypal_client_id', value: '', description: 'PayPal client ID', category: 'payment', isPublic: true },
    
    // Shipping settings
    { key: 'free_shipping_threshold', value: 50, description: 'Minimum order amount for free shipping', category: 'shipping', isPublic: true },
    { key: 'default_shipping_rate', value: 5.99, description: 'Default shipping rate', category: 'shipping', isPublic: true },
    { key: 'shipping_zones', value: [], description: 'Configured shipping zones', category: 'shipping', isPublic: false },
    
    // Email settings
    { key: 'smtp_host', value: '', description: 'SMTP server host', category: 'email', isPublic: false },
    { key: 'smtp_port', value: 587, description: 'SMTP server port', category: 'email', isPublic: false },
    { key: 'smtp_username', value: '', description: 'SMTP username', category: 'email', isPublic: false },
    { key: 'from_email', value: 'noreply@shopsphere.com', description: 'From email address', category: 'email', isPublic: false },
    { key: 'from_name', value: 'ShopSphere', description: 'From name', category: 'email', isPublic: false },
    
    // Security settings
    { key: 'max_login_attempts', value: 5, description: 'Maximum login attempts before lockout', category: 'security', isPublic: false },
    { key: 'lockout_duration', value: 30, description: 'Account lockout duration in minutes', category: 'security', isPublic: false },
    { key: 'session_timeout', value: 24, description: 'Session timeout in hours', category: 'security', isPublic: false },
    { key: 'password_min_length', value: 8, description: 'Minimum password length', category: 'security', isPublic: true },
    { key: 'require_email_verification', value: true, description: 'Require email verification for new accounts', category: 'security', isPublic: true },
    
    // Analytics settings
    { key: 'google_analytics_id', value: '', description: 'Google Analytics tracking ID', category: 'analytics', isPublic: true },
    { key: 'facebook_pixel_id', value: '', description: 'Facebook Pixel ID', category: 'analytics', isPublic: true },
    { key: 'enable_analytics', value: true, description: 'Enable analytics tracking', category: 'analytics', isPublic: true },
    
    // Notification settings
    { key: 'enable_email_notifications', value: true, description: 'Enable email notifications', category: 'notifications', isPublic: false },
    { key: 'enable_sms_notifications', value: false, description: 'Enable SMS notifications', category: 'notifications', isPublic: false },
    { key: 'admin_notification_email', value: 'admin@shopsphere.com', description: 'Admin notification email', category: 'notifications', isPublic: false }
  ];

  for (const setting of defaultSettings) {
    await this.findOneAndUpdate(
      { key: setting.key },
      { ...setting, updatedBy: adminUserId },
      { upsert: true, new: true }
    );
  }
};

const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

export default SystemSettings;
