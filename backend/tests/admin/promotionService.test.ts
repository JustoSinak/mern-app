import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, AdminActivity } from '../../models';
import Promotion, { PromotionUsage } from '../../models/Promotion';
import { PromotionService } from '../../services/promotionService';
import { ICreatePromotionRequest } from '../../types/admin';

describe('PromotionService', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: any;
  let testUser: any;
  let testPromotion: any;

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

    // Create test promotion
    testPromotion = await Promotion.create({
      name: 'Test Promotion',
      description: 'Test promotion description',
      code: 'TEST10',
      type: 'percentage',
      value: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      createdBy: adminUser._id
    });
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('createPromotion', () => {
    it('should create a new promotion successfully', async () => {
      const promotionData: ICreatePromotionRequest = {
        name: 'New Promotion',
        description: 'New promotion description',
        code: 'NEW20',
        type: 'percentage',
        value: 20,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      };

      const promotion = await PromotionService.createPromotion(
        promotionData,
        adminUser._id.toString()
      );

      expect(promotion.name).toBe('New Promotion');
      expect(promotion.code).toBe('NEW20');
      expect(promotion.type).toBe('percentage');
      expect(promotion.value).toBe(20);

      // Check if admin activity was logged
      const activity = await AdminActivity.findOne({
        adminId: adminUser._id,
        action: 'create_promotion'
      });
      expect(activity).toBeTruthy();
    });

    it('should throw error for duplicate promotion code', async () => {
      const promotionData: ICreatePromotionRequest = {
        name: 'Duplicate Promotion',
        description: 'Duplicate promotion description',
        code: 'TEST10', // Same as existing promotion
        type: 'fixed',
        value: 5,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      };

      await expect(PromotionService.createPromotion(
        promotionData,
        adminUser._id.toString()
      )).rejects.toThrow('Promotion code already exists');
    });

    it('should throw error for invalid date range', async () => {
      const promotionData: ICreatePromotionRequest = {
        name: 'Invalid Date Promotion',
        description: 'Invalid date promotion description',
        code: 'INVALID',
        type: 'percentage',
        value: 10,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(), // End date before start date
        isActive: true
      };

      await expect(PromotionService.createPromotion(
        promotionData,
        adminUser._id.toString()
      )).rejects.toThrow('End date must be after start date');
    });
  });

  describe('getPromotions', () => {
    it('should return paginated promotions', async () => {
      const result = await PromotionService.getPromotions({
        page: 1,
        limit: 10
      });

      expect(result.promotions).toHaveLength(1);
      expect(result.pagination.totalPromotions).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should filter promotions by type', async () => {
      // Create another promotion with different type
      await Promotion.create({
        name: 'Fixed Promotion',
        description: 'Fixed promotion description',
        code: 'FIXED5',
        type: 'fixed',
        value: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id
      });

      const result = await PromotionService.getPromotions({
        page: 1,
        limit: 10,
        type: 'fixed'
      });

      expect(result.promotions).toHaveLength(1);
      expect(result.promotions[0].type).toBe('fixed');
    });

    it('should search promotions by name and code', async () => {
      const result = await PromotionService.getPromotions({
        page: 1,
        limit: 10,
        search: 'TEST'
      });

      expect(result.promotions).toHaveLength(1);
      expect(result.promotions[0].code).toBe('TEST10');
    });
  });

  describe('getPromotionById', () => {
    it('should return promotion with usage statistics', async () => {
      const promotion = await PromotionService.getPromotionById(
        testPromotion._id.toString()
      );

      expect(promotion._id.toString()).toBe(testPromotion._id.toString());
      expect(promotion.usageStats).toBeDefined();
      expect(promotion.usageStats.totalUsage).toBe(0);
      expect(promotion.usageStats.totalDiscount).toBe(0);
    });

    it('should throw error for non-existent promotion', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(PromotionService.getPromotionById(nonExistentId))
        .rejects
        .toThrow('Promotion not found');
    });
  });

  describe('updatePromotion', () => {
    it('should update promotion successfully', async () => {
      const updateData = {
        name: 'Updated Promotion',
        value: 15,
        isActive: false
      };

      const updatedPromotion = await PromotionService.updatePromotion(
        testPromotion._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(updatedPromotion.name).toBe('Updated Promotion');
      expect(updatedPromotion.value).toBe(15);
      expect(updatedPromotion.isActive).toBe(false);

      // Check if admin activity was logged
      const activity = await AdminActivity.findOne({
        adminId: adminUser._id,
        action: 'update_promotion'
      });
      expect(activity).toBeTruthy();
    });

    it('should throw error for duplicate code when updating', async () => {
      // Create another promotion
      const anotherPromotion = await Promotion.create({
        name: 'Another Promotion',
        description: 'Another promotion description',
        code: 'ANOTHER',
        type: 'percentage',
        value: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id
      });

      await expect(PromotionService.updatePromotion(
        anotherPromotion._id.toString(),
        { code: 'TEST10' }, // Trying to use existing code
        adminUser._id.toString()
      )).rejects.toThrow('Promotion code already exists');
    });
  });

  describe('deletePromotion', () => {
    it('should hard delete promotion with no usage', async () => {
      const result = await PromotionService.deletePromotion(
        testPromotion._id.toString(),
        adminUser._id.toString()
      );

      expect(result.message).toBe('Promotion deleted successfully');

      // Check if promotion is deleted
      const promotion = await Promotion.findById(testPromotion._id);
      expect(promotion).toBeNull();
    });

    it('should soft delete promotion with usage history', async () => {
      // Create usage record
      await PromotionUsage.create({
        promotionId: testPromotion._id,
        userId: testUser._id,
        orderId: new mongoose.Types.ObjectId(),
        discountAmount: 10,
        usedAt: new Date()
      });

      const result = await PromotionService.deletePromotion(
        testPromotion._id.toString(),
        adminUser._id.toString()
      );

      expect(result.message).toBe('Promotion deactivated (had usage history)');

      // Check if promotion is deactivated, not deleted
      const promotion = await Promotion.findById(testPromotion._id);
      expect(promotion).toBeTruthy();
      expect(promotion?.isActive).toBe(false);
    });
  });

  describe('validatePromotionCode', () => {
    it('should validate active promotion code', async () => {
      const result = await PromotionService.validatePromotionCode(
        'TEST10',
        testUser._id.toString(),
        100 // order amount
      );

      expect(result.isValid).toBe(true);
      expect(result.promotion.code).toBe('TEST10');
      expect(result.discountAmount).toBe(10); // 10% of 100
    });

    it('should throw error for invalid promotion code', async () => {
      await expect(PromotionService.validatePromotionCode(
        'INVALID',
        testUser._id.toString(),
        100
      )).rejects.toThrow('Invalid promotion code');
    });

    it('should throw error for expired promotion', async () => {
      // Update promotion to be expired
      await Promotion.findByIdAndUpdate(testPromotion._id, {
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });

      await expect(PromotionService.validatePromotionCode(
        'TEST10',
        testUser._id.toString(),
        100
      )).rejects.toThrow('Promotion code is not currently valid');
    });

    it('should throw error when usage limit exceeded', async () => {
      // Update promotion with usage limit
      await Promotion.findByIdAndUpdate(testPromotion._id, {
        usageLimit: 1,
        currentUsage: 1
      });

      await expect(PromotionService.validatePromotionCode(
        'TEST10',
        testUser._id.toString(),
        100
      )).rejects.toThrow('Promotion code usage limit exceeded');
    });

    it('should throw error when minimum order amount not met', async () => {
      // Update promotion with minimum order amount
      await Promotion.findByIdAndUpdate(testPromotion._id, {
        minimumOrderAmount: 200
      });

      await expect(PromotionService.validatePromotionCode(
        'TEST10',
        testUser._id.toString(),
        100 // Less than minimum
      )).rejects.toThrow('Minimum order amount of $200 required');
    });
  });

  describe('applyPromotion', () => {
    it('should apply promotion and update usage', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      
      const usage = await PromotionService.applyPromotion(
        testPromotion._id.toString(),
        testUser._id.toString(),
        orderId,
        10
      );

      expect(usage.promotionId.toString()).toBe(testPromotion._id.toString());
      expect(usage.userId.toString()).toBe(testUser._id.toString());
      expect(usage.discountAmount).toBe(10);

      // Check if promotion usage count is updated
      const updatedPromotion = await Promotion.findById(testPromotion._id);
      expect(updatedPromotion?.currentUsage).toBe(1);
    });
  });
});
