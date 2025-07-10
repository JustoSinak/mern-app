// MongoDB initialization script
db = db.getSiblingDB('shopphere');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        firstName: {
          bsonType: 'string',
          minLength: 1
        },
        lastName: {
          bsonType: 'string',
          minLength: 1
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price', 'category', 'inventory'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1
        },
        price: {
          bsonType: 'number',
          minimum: 0
        },
        inventory: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ 'refreshTokens.token': 1 });

db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ 'reviews.rating': 1 });

db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

db.carts.createIndex({ userId: 1 }, { unique: true });

print('Database initialized successfully!');
