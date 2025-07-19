import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/types';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // AppError instance'ı ise
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }
  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // SQLite errors
  else if (error.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
    statusCode = 409;
    message = 'Resource already exists';
  }
  else if (error.message.includes('SQLITE_CONSTRAINT_FOREIGN_KEY')) {
    statusCode = 400;
    message = 'Invalid reference';
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    logger.warn('Client Error:', {
      message: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      statusCode
    });
  }

  // Development mode'da stack trace göster
  const response: any = {
    success: false,
    error: message,
    statusCode
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.message;
  }

  res.status(statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 