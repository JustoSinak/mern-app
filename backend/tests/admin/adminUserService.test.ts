import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, AdminActivity } from '../../models';
import { AdminUserService } from '../../services/adminUserService';
import { IUserSearchQuery, IBulkUserOperation } from '../../types/user';

describe('AdminUserService', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let adminUser: any;

  beforeEach(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      isActive: true,
      isEmailVerified: true
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const query: IUserSearchQuery = {
        page: 1,
        limit: 10
      };

      const result = await AdminUserService.getUsers(query);

      expect(result.users).toHaveLength(2);
      expect(result.pagination.totalUsers).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should filter users by role', async () => {
      const query: IUserSearchQuery = {
        page: 1,
        limit: 10,
        role: 'admin'
      };

      const result = await AdminUserService.getUsers(query);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].role).toBe('admin');
    });

    it('should search users by name and email', async () => {
      const query: IUserSearchQuery = {
        page: 1,
        limit: 10,
        search: 'test'
      };

      const result = await AdminUserService.getUsers(query);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('test@example.com');
    });

    it('should filter by active status', async () => {
      // Create inactive user
      await User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        role: 'user',
        isActive: false,
        isEmailVerified: true
      });

      const query: IUserSearchQuery = {
        page: 1,
        limit: 10,
        isActive: false
      };

      const result = await AdminUserService.getUsers(query);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].isActive).toBe(false);
    });
  });

  describe('getUserById', () => {
    it('should return user with order statistics', async () => {
      const user = await AdminUserService.getUserById(testUser._id.toString());

      expect(user._id.toString()).toBe(testUser._id.toString());
      expect(user.orderStats).toBeDefined();
      expect(user.orderStats.totalOrders).toBe(0);
      expect(user.orderStats.totalSpent).toBe(0);
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(AdminUserService.getUserById(nonExistentId))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'moderator' as const
      };

      const updatedUser = await AdminUserService.updateUser(
        testUser._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.role).toBe('moderator');

      // Check if admin activity was logged
      const activity = await AdminActivity.findOne({
        adminId: adminUser._id,
        action: 'update_user'
      });
      expect(activity).toBeTruthy();
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(AdminUserService.updateUser(
        nonExistentId,
        { firstName: 'Test' },
        adminUser._id.toString()
      )).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user (deactivate)', async () => {
      const result = await AdminUserService.deleteUser(
        testUser._id.toString(),
        adminUser._id.toString()
      );

      expect(result.message).toBe('User deleted successfully');

      // Check if user is deactivated
      const user = await User.findById(testUser._id);
      expect(user?.isActive).toBe(false);

      // Check if admin activity was logged
      const activity = await AdminActivity.findOne({
        adminId: adminUser._id,
        action: 'delete_user'
      });
      expect(activity).toBeTruthy();
    });

    it('should not allow deleting admin users', async () => {
      await expect(AdminUserService.deleteUser(
        adminUser._id.toString(),
        adminUser._id.toString()
      )).rejects.toThrow('Cannot delete admin users');
    });
  });

  describe('bulkOperation', () => {
    let user2: any;

    beforeEach(async () => {
      user2 = await User.create({
        firstName: 'Test2',
        lastName: 'User2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'user',
        isActive: true,
        isEmailVerified: true
      });
    });

    it('should activate multiple users', async () => {
      // First deactivate users
      await User.updateMany(
        { _id: { $in: [testUser._id, user2._id] } },
        { isActive: false }
      );

      const operation: IBulkUserOperation = {
        userIds: [testUser._id.toString(), user2._id.toString()],
        operation: 'activate'
      };

      const result = await AdminUserService.bulkOperation(
        operation,
        adminUser._id.toString()
      );

      expect(result.affectedCount).toBe(2);

      // Check if users are activated
      const users = await User.find({ _id: { $in: [testUser._id, user2._id] } });
      users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should update roles for multiple users', async () => {
      const operation: IBulkUserOperation = {
        userIds: [testUser._id.toString(), user2._id.toString()],
        operation: 'updateRole',
        data: { role: 'moderator' }
      };

      const result = await AdminUserService.bulkOperation(
        operation,
        adminUser._id.toString()
      );

      expect(result.affectedCount).toBe(2);

      // Check if roles are updated
      const users = await User.find({ _id: { $in: [testUser._id, user2._id] } });
      users.forEach(user => {
        expect(user.role).toBe('moderator');
      });
    });

    it('should not allow bulk delete of admin users', async () => {
      const operation: IBulkUserOperation = {
        userIds: [adminUser._id.toString()],
        operation: 'delete'
      };

      await expect(AdminUserService.bulkOperation(
        operation,
        adminUser._id.toString()
      )).rejects.toThrow('Cannot perform this operation on admin users');
    });

    it('should throw error for empty user selection', async () => {
      const operation: IBulkUserOperation = {
        userIds: [],
        operation: 'activate'
      };

      await expect(AdminUserService.bulkOperation(
        operation,
        adminUser._id.toString()
      )).rejects.toThrow('No users selected');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const stats = await AdminUserService.getUserStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(2);
      expect(stats.usersByRole.user).toBe(1);
      expect(stats.usersByRole.admin).toBe(1);
      expect(stats.usersByRole.moderator).toBe(0);
    });
  });

  describe('searchUsers', () => {
    it('should search users by email', async () => {
      const users = await AdminUserService.searchUsers('test@example.com', 10);

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('test@example.com');
    });

    it('should search users by name', async () => {
      const users = await AdminUserService.searchUsers('Test', 10);

      expect(users).toHaveLength(1);
      expect(users[0].firstName).toBe('Test');
    });

    it('should limit search results', async () => {
      const users = await AdminUserService.searchUsers('User', 1);

      expect(users).toHaveLength(1);
    });
  });
});
