import mongoose, { Schema } from 'mongoose';
import { IPermission } from '../types/admin';

const permissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Permission description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    enum: ['users', 'products', 'orders', 'categories', 'promotions', 'analytics', 'settings', 'system'],
    lowercase: true
  },
  actions: [{
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage', 'export', 'import', 'bulk_operations']
  }]
}, {
  timestamps: true
});

// Indexes
permissionSchema.index({ name: 1 });
permissionSchema.index({ resource: 1 });

// Static method to create default permissions
permissionSchema.statics.createDefaultPermissions = async function() {
  const defaultPermissions = [
    // User management
    { name: 'manage_users', description: 'Full user management access', resource: 'users', actions: ['create', 'read', 'update', 'delete', 'bulk_operations'] },
    { name: 'view_users', description: 'View users only', resource: 'users', actions: ['read'] },
    { name: 'edit_users', description: 'Edit user profiles', resource: 'users', actions: ['read', 'update'] },
    
    // Product management
    { name: 'manage_products', description: 'Full product management access', resource: 'products', actions: ['create', 'read', 'update', 'delete', 'bulk_operations', 'import', 'export'] },
    { name: 'view_products', description: 'View products only', resource: 'products', actions: ['read'] },
    { name: 'edit_products', description: 'Edit products', resource: 'products', actions: ['read', 'update'] },
    
    // Order management
    { name: 'manage_orders', description: 'Full order management access', resource: 'orders', actions: ['read', 'update', 'delete', 'bulk_operations', 'export'] },
    { name: 'view_orders', description: 'View orders only', resource: 'orders', actions: ['read'] },
    { name: 'process_orders', description: 'Process and update orders', resource: 'orders', actions: ['read', 'update'] },
    
    // Category management
    { name: 'manage_categories', description: 'Full category management access', resource: 'categories', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'view_categories', description: 'View categories only', resource: 'categories', actions: ['read'] },
    
    // Promotion management
    { name: 'manage_promotions', description: 'Full promotion management access', resource: 'promotions', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'view_promotions', description: 'View promotions only', resource: 'promotions', actions: ['read'] },
    
    // Analytics
    { name: 'view_analytics', description: 'View analytics and reports', resource: 'analytics', actions: ['read', 'export'] },
    { name: 'advanced_analytics', description: 'Access to advanced analytics', resource: 'analytics', actions: ['read', 'export', 'manage'] },
    
    // System settings
    { name: 'manage_settings', description: 'Manage system settings', resource: 'settings', actions: ['read', 'update'] },
    { name: 'system_admin', description: 'Full system administration', resource: 'system', actions: ['manage'] }
  ];

  for (const permission of defaultPermissions) {
    await this.findOneAndUpdate(
      { name: permission.name },
      permission,
      { upsert: true, new: true }
    );
  }
};

const Permission = mongoose.model<IPermission>('Permission', permissionSchema);

export default Permission;
