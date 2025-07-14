import request from 'supertest';
import { app } from '../app';
import { Product, User } from '../models';
import { connectDB } from '../config/database';
import mongoose from 'mongoose';

describe('Product Endpoints', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectDB();
    
    // Create test user
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    authToken = userResponse.body.data.tokens.accessToken;

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);
    
    // Update user role to admin
    await User.findByIdAndUpdate(adminResponse.body.data.user._id, { role: 'admin' });
    
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: adminData.email, password: adminData.password });
    
    adminToken = adminLoginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin token', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'electronics',
        stock: 10,
        images: ['test-image.jpg']
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
    });

    it('should reject product creation without admin token', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'electronics',
        stock: 10
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
