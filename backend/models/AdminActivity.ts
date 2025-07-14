import mongoose, { Schema } from 'mongoose';
import { IAdminActivity } from '../types/admin';

const adminActivitySchema = new Schema<IAdminActivity>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    maxlength: [100, 'Action cannot exceed 100 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    enum: ['user', 'product', 'order', 'category', 'promotion', 'role', 'permission', 'setting', 'system'],
    lowercase: true
  },
  resourceId: {
    type: String,
    maxlength: [100, 'Resource ID cannot exceed 100 characters']
  },
  details: {
    type: Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address format']
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We're using custom timestamp field
});

// Indexes for efficient querying
adminActivitySchema.index({ adminId: 1, timestamp: -1 });
adminActivitySchema.index({ resource: 1, timestamp: -1 });
adminActivitySchema.index({ action: 1, timestamp: -1 });
adminActivitySchema.index({ timestamp: -1 });
adminActivitySchema.index({ resourceId: 1 });

// TTL index to automatically delete old activity logs (keep for 1 year)
adminActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static method to log admin activity
adminActivitySchema.statics.logActivity = async function(
  adminId: string,
  action: string,
  resource: string,
  details: any,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const activity = new this({
      adminId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    // Log error but don't throw to avoid breaking the main operation
    console.error('Failed to log admin activity:', error);
    return null;
  }
};

// Static method to get activity summary
adminActivitySchema.statics.getActivitySummary = async function(
  adminId?: string,
  resource?: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchStage: any = {
    timestamp: { $gte: startDate }
  };
  
  if (adminId) matchStage.adminId = new mongoose.Types.ObjectId(adminId);
  if (resource) matchStage.resource = resource;
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.resource',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            lastActivity: '$lastActivity'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get recent activities
adminActivitySchema.statics.getRecentActivities = async function(
  limit: number = 50,
  adminId?: string,
  resource?: string
) {
  const query: any = {};
  if (adminId) query.adminId = adminId;
  if (resource) query.resource = resource;
  
  return this.find(query)
    .populate('adminId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

const AdminActivity = mongoose.model<IAdminActivity>('AdminActivity', adminActivitySchema);

export default AdminActivity;
