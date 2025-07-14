import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import { User } from '../../models';
import jwt from 'jsonwebtoken';

describe('Admin Controller', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: any;
  let testUser: any;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      isActive: true,
      isEmailVerified: true
    });

    // Generate JWT tokens
    adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('GET /api/admin/users', () => {
    it('should return users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should deny access for non-admin users', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('admin');
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=test@example.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('test@example.com');
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.orderStats).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid user ID', async () => {
      await request(app)
        .get('/api/admin/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'moderator'
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.role).toBe('moderator');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '', // Empty first name
        email: 'invalid-email' // Invalid email format
      };

      await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Check if user is deactivated
      const user = await User.findById(testUser._id);
      expect(user?.isActive).toBe(false);
    });

    it('should not allow deleting admin users', async () => {
      await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe('POST /api/admin/users/bulk', () => {
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

    it('should perform bulk activate operation', async () => {
      // First deactivate users
      await User.updateMany(
        { _id: { $in: [testUser._id, user2._id] } },
        { isActive: false }
      );

      const bulkData = {
        userIds: [testUser._id.toString(), user2._id.toString()],
        operation: 'activate'
      };

      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.affectedCount).toBe(2);

      // Check if users are activated
      const users = await User.find({ _id: { $in: [testUser._id, user2._id] } });
      users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should perform bulk role update operation', async () => {
      const bulkData = {
        userIds: [testUser._id.toString(), user2._id.toString()],
        operation: 'updateRole',
        data: { role: 'moderator' }
      };

      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.affectedCount).toBe(2);

      // Check if roles are updated
      const users = await User.find({ _id: { $in: [testUser._id, user2._id] } });
      users.forEach(user => {
        expect(user.role).toBe('moderator');
      });
    });

    it('should validate bulk operation data', async () => {
      const invalidData = {
        userIds: [], // Empty array
        operation: 'activate'
      };

      await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should not allow bulk operations on admin users for delete', async () => {
      const bulkData = {
        userIds: [adminUser._id.toString()],
        operation: 'delete'
      };

      await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(2);
      expect(response.body.data.activeUsers).toBe(2);
      expect(response.body.data.usersByRole).toBeDefined();
    });
  });

  describe('GET /api/admin/users/search', () => {
    it('should search users by query', async () => {
      const response = await request(app)
        .get('/api/admin/users/search?q=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Test');
    });

    it('should require search query', async () => {
      await request(app)
        .get('/api/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should limit search results', async () => {
      const response = await request(app)
        .get('/api/admin/users/search?q=User&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });
});
