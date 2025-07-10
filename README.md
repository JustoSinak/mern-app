# ShopSphere - Advanced Ecommerce PWA Platform

A full-featured Progressive Web Application (PWA) ecommerce platform built with the MERN stack, following enterprise-level architecture patterns and best practices.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**: JWT with refresh tokens, OAuth2 (Google, Facebook), RBAC
- **Product Management**: Advanced search, filtering, categorization, inventory management
- **Shopping Cart**: Real-time updates, guest cart merging, persistent storage
- **Order Management**: Complete order lifecycle, tracking, returns, refunds
- **Payment Processing**: Stripe integration with secure payment handling
- **Real-time Updates**: Socket.io for live inventory, order status, notifications

### Advanced Features
- **Progressive Web App**: Offline functionality, push notifications, installable
- **Performance Optimized**: Caching strategies, code splitting, lazy loading
- **Security Hardened**: Rate limiting, input validation, XSS protection
- **Scalable Architecture**: Microservices-ready, horizontal scaling support
- **Comprehensive Testing**: Unit, integration, and E2E tests
- **DevOps Ready**: Docker containerization, CI/CD pipeline

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB 6+ with Mongoose ODM
- **Authentication**: JWT, Passport.js (OAuth2)
- **Payment**: Stripe
- **Real-time**: Socket.io
- **Caching**: Redis
- **Testing**: Jest, Supertest
- **Security**: Helmet, Rate limiting, Input validation

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router 6+
- **UI**: Responsive design, PWA capabilities
- **Testing**: React Testing Library, Jest
- **Build**: Create React App (upgradeable to Vite)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (production)
- **Monitoring**: Winston logging
- **Environment**: Multi-stage Docker builds

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 6+
- Redis (optional, for caching)
- Docker & Docker Compose (for containerized setup)

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-app
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

### Option 2: Local Development Setup

1. **Clone and setup backend**
   ```bash
   git clone <repository-url>
   cd mern-app
   npm install
   cp .env.example .env
   # Configure your .env file
   ```

2. **Setup frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Start MongoDB and Redis** (if not using Docker)
   ```bash
   # MongoDB
   mongod

   # Redis (optional)
   redis-server
   ```

4. **Start the applications**
   ```bash
   # Backend (from root directory)
   npm run dev

   # Frontend (from frontend directory)
   cd frontend && npm start
   ```

## 📁 Project Structure

```
mern-app/
├── src/                          # Backend source code
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Custom middleware
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript type definitions
│   ├── config/                   # Configuration files
│   └── app.ts                    # Main application file
├── frontend/                     # Frontend React application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── store/                # Redux store and slices
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   ├── services/             # API services
│   │   └── types/                # TypeScript types
│   └── public/                   # Static assets
├── tests/                        # Test files
├── logs/                         # Application logs
├── docker-compose.yml            # Docker composition
├── Dockerfile.backend            # Backend Docker configuration
├── Dockerfile.frontend           # Frontend Docker configuration
└── README.md                     # Project documentation
```

## 🔧 Development

### Available Scripts

#### Backend Scripts
```bash
npm run build          # Build TypeScript to JavaScript
npm run dev            # Start development server with hot reload
npm start              # Start production server
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

#### Frontend Scripts
```bash
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
npm run eject          # Eject from Create React App (irreversible)
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/shopphere

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email
EMAIL_FROM=noreply@shopphere.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Frontend tests
cd frontend
npm test                   # Run React tests
npm test -- --coverage    # With coverage
```

### Test Structure

- **Unit Tests**: Individual function/component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing

## 🚀 Deployment

### Production Build

```bash
# Build backend
npm run build

# Build frontend
cd frontend && npm run build
```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Performance Targets

- **API Response Time**: < 200ms
- **Bundle Size**: < 250KB (gzipped)
- **Lighthouse Score**: > 90
- **Concurrent Users**: 10,000+
- **Database Query Time**: < 100ms

## 🔒 Security Features

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API endpoint protection
- **Security Headers**: Helmet.js implementation
- **CORS**: Configured cross-origin resource sharing
- **XSS Protection**: Input sanitization and CSP headers

## 🏗 Architecture Patterns

- **MVC Pattern**: Model-View-Controller separation
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Middleware Pattern**: Request/response processing
- **Observer Pattern**: Real-time event handling
