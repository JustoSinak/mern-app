import { Permission, Role, User, SystemSettings } from '../models';
import { logger } from './logger';
import bcrypt from 'bcryptjs';

/**
 * Initialize the admin system with default permissions, roles, and settings
 */
export const initializeAdminSystem = async (): Promise<void> => {
  try {
    logger.info('🔧 Initializing admin system...');

    // 1. Create default permissions
    await createDefaultPermissions();

    // 2. Create default roles
    await createDefaultRoles();

    // 3. Create default admin user if none exists
    await createDefaultAdminUser();

    // 4. Initialize system settings
    await initializeSystemSettings();

    logger.info('✅ Admin system initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize admin system:', error);
    throw error;
  }
};

/**
 * Create default permissions
 */
const createDefaultPermissions = async (): Promise<void> => {
  try {
    const existingPermissions = await Permission.countDocuments();
    
    if (existingPermissions === 0) {
      logger.info('Creating default permissions...');
      await (Permission as any).createDefaultPermissions();
      logger.info('✅ Default permissions created');
    } else {
      logger.info('📋 Permissions already exist, skipping creation');
    }
  } catch (error) {
    logger.error('Failed to create default permissions:', error);
    throw error;
  }
};

/**
 * Create default roles
 */
const createDefaultRoles = async (): Promise<void> => {
  try {
    const existingRoles = await Role.countDocuments();
    
    if (existingRoles === 0) {
      logger.info('Creating default roles...');
      await (Role as any).createDefaultRoles();
      logger.info('✅ Default roles created');
    } else {
      logger.info('👥 Roles already exist, skipping creation');
    }
  } catch (error) {
    logger.error('Failed to create default roles:', error);
    throw error;
  }
};

/**
 * Create default admin user if none exists
 */
const createDefaultAdminUser = async (): Promise<void> => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (!existingAdmin) {
      logger.info('Creating default admin user...');
      
      const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@shopsphere.com';
      const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
      
      // Check if user with this email already exists
      const existingUser = await User.findOne({ email: defaultAdminEmail });
      
      if (existingUser) {
        // Update existing user to admin role
        existingUser.role = 'admin';
        existingUser.isActive = true;
        existingUser.isEmailVerified = true;
        await existingUser.save();
        logger.info(`✅ Updated existing user ${defaultAdminEmail} to admin role`);
      } else {
        // Create new admin user
        const adminUser = new User({
          firstName: 'System',
          lastName: 'Administrator',
          email: defaultAdminEmail,
          password: defaultAdminPassword,
          role: 'admin',
          isActive: true,
          isEmailVerified: true,
          preferences: {
            newsletter: false,
            smsNotifications: false,
            emailNotifications: true,
            currency: 'USD',
            language: 'en',
            theme: 'auto'
          }
        });
        
        await adminUser.save();
        logger.info(`✅ Default admin user created: ${defaultAdminEmail}`);
        logger.warn(`🔐 Default admin password: ${defaultAdminPassword}`);
        logger.warn('⚠️  Please change the default admin password immediately!');
      }
    } else {
      logger.info('👤 Admin user already exists, skipping creation');
    }
  } catch (error) {
    logger.error('Failed to create default admin user:', error);
    throw error;
  }
};

/**
 * Initialize system settings
 */
const initializeSystemSettings = async (): Promise<void> => {
  try {
    const existingSettings = await SystemSettings.countDocuments();
    
    if (existingSettings === 0) {
      logger.info('Initializing system settings...');
      
      // Find an admin user to use as the creator
      const adminUser = await User.findOne({ role: 'admin' });
      
      if (adminUser) {
        await (SystemSettings as any).initializeDefaultSettings(adminUser._id.toString());
        logger.info('✅ System settings initialized');
      } else {
        logger.warn('⚠️  No admin user found, skipping system settings initialization');
      }
    } else {
      logger.info('⚙️  System settings already exist, skipping initialization');
    }
  } catch (error) {
    logger.error('Failed to initialize system settings:', error);
    throw error;
  }
};

/**
 * Create a super admin user (for development/testing)
 */
export const createSuperAdmin = async (
  email: string,
  password: string,
  firstName: string = 'Super',
  lastName: string = 'Admin'
): Promise<void> => {
  try {
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const superAdmin = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      preferences: {
        newsletter: false,
        smsNotifications: false,
        emailNotifications: true,
        currency: 'USD',
        language: 'en',
        theme: 'auto'
      }
    });
    
    await superAdmin.save();
    logger.info(`✅ Super admin user created: ${email}`);
  } catch (error) {
    logger.error('Failed to create super admin user:', error);
    throw error;
  }
};

/**
 * Reset admin system (for development/testing)
 */
export const resetAdminSystem = async (): Promise<void> => {
  try {
    logger.warn('🔄 Resetting admin system...');
    
    // Delete all permissions, roles, and settings
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      SystemSettings.deleteMany({})
    ]);
    
    // Reinitialize
    await initializeAdminSystem();
    
    logger.info('✅ Admin system reset complete');
  } catch (error) {
    logger.error('Failed to reset admin system:', error);
    throw error;
  }
};

/**
 * Check if admin system is properly initialized
 */
export const checkAdminSystemHealth = async (): Promise<{
  isHealthy: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];
  
  try {
    // Check permissions
    const permissionCount = await Permission.countDocuments();
    if (permissionCount === 0) {
      issues.push('No permissions found');
    }
    
    // Check roles
    const roleCount = await Role.countDocuments();
    if (roleCount === 0) {
      issues.push('No roles found');
    }
    
    // Check admin users
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount === 0) {
      issues.push('No active admin users found');
    }
    
    // Check system settings
    const settingsCount = await SystemSettings.countDocuments();
    if (settingsCount === 0) {
      issues.push('No system settings found');
    }
    
    return {
      isHealthy: issues.length === 0,
      issues
    };
  } catch (error) {
    issues.push(`Health check failed: ${error}`);
    return {
      isHealthy: false,
      issues
    };
  }
};
