"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("@/utils/logger");
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopphere';
        const conn = await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
        });
        process.on('SIGINT', async () => {
            try {
                await mongoose_1.default.connection.close();
                logger_1.logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during MongoDB disconnection:', error);
                process.exit(1);
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from MongoDB:', error);
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map