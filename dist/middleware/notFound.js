"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const errorHandler_1 = require("./errorHandler");
const notFound = (req, res, next) => {
    const error = new errorHandler_1.AppError(`Not found - ${req.originalUrl}`, 404);
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=notFound.js.map