import mongoose, { Schema } from 'mongoose';
import { IRole } from '../types/admin';

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  }],
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ isDefault: 1 });

// Virtual to populate permissions
roleSchema.virtual('permissionDetails', {
  ref: 'Permission',
  localField: 'permissions',
  foreignField: '_id'
});

// Static method to create default roles
roleSchema.statics.createDefaultRoles = async function() {
  const Permission = mongoose.model('Permission');
  
  // Get permission IDs
  const allPermissions = await Permission.find({});
  const permissionMap = allPermissions.reduce((map, perm) => {
    map[perm.name] = perm._id;
    return map;
  }, {} as any);

  const defaultRoles = [
    {
      name: 'super_admin',
      description: 'Full system access with all permissions',
      permissions: Object.values(permissionMap),
      isDefault: false
    },
    {
      name: 'admin',
      description: 'Standard admin with most permissions',
      permissions: [
        permissionMap.manage_users,
        permissionMap.manage_products,
        permissionMap.manage_orders,
        permissionMap.manage_categories,
        permissionMap.manage_promotions,
        permissionMap.view_analytics,
        permissionMap.manage_settings
      ].filter(Boolean),
      isDefault: true
    },
    {
      name: 'moderator',
      description: 'Limited admin access for content moderation',
      permissions: [
        permissionMap.view_users,
        permissionMap.edit_users,
        permissionMap.view_products,
        permissionMap.edit_products,
        permissionMap.view_orders,
        permissionMap.process_orders,
        permissionMap.view_categories,
        permissionMap.view_promotions
      ].filter(Boolean),
      isDefault: false
    },
    {
      name: 'content_manager',
      description: 'Manage products and categories only',
      permissions: [
        permissionMap.manage_products,
        permissionMap.manage_categories,
        permissionMap.view_orders
      ].filter(Boolean),
      isDefault: false
    },
    {
      name: 'customer_service',
      description: 'Handle customer orders and basic user management',
      permissions: [
        permissionMap.view_users,
        permissionMap.edit_users,
        permissionMap.manage_orders,
        permissionMap.view_products
      ].filter(Boolean),
      isDefault: false
    }
  ];

  for (const role of defaultRoles) {
    await this.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }
};

// Instance method to check if role has specific permission
roleSchema.methods.hasPermission = function(permissionName: string, action: string) {
  return this.populate('permissions').then(() => {
    return this.permissions.some((permission: any) => 
      permission.name === permissionName && permission.actions.includes(action)
    );
  });
};

const Role = mongoose.model<IRole>('Role', roleSchema);

export default Role;
