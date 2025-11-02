/**
 * Comprehensive Error Handling Utility
 *
 * Provides consistent error handling, logging, and user-friendly error messages
 */

import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Custom Business Logic Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage?: string; // User-friendly message
  details?: unknown;
  statusCode: number;
}

/**
 * Custom application error class
 */
export class ApplicationError extends Error {
  code: ErrorCode;
  userMessage?: string;
  details?: unknown;
  statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.userMessage = userMessage || message;
    this.details = details;
    this.statusCode = this.getStatusCode(code);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  private getStatusCode(code: ErrorCode): number {
    switch (code) {
      case ErrorCode.BAD_REQUEST:
      case ErrorCode.VALIDATION_ERROR:
        return 400;
      case ErrorCode.UNAUTHORIZED:
        return 401;
      case ErrorCode.FORBIDDEN:
        return 403;
      case ErrorCode.NOT_FOUND:
        return 404;
      case ErrorCode.CONFLICT:
        return 409;
      case ErrorCode.UNPROCESSABLE_ENTITY:
        return 422;
      case ErrorCode.TOO_MANY_REQUESTS:
      case ErrorCode.RATE_LIMIT_ERROR:
        return 429;
      case ErrorCode.SERVICE_UNAVAILABLE:
        return 503;
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.AI_SERVICE_ERROR:
      case ErrorCode.SUBSCRIPTION_ERROR:
      case ErrorCode.INTERNAL_SERVER_ERROR:
      default:
        return 500;
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.userMessage || this.message,
      details: this.details,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Error factory functions for common error scenarios
 */
export const ErrorFactory = {
  notFound: (resource: string, id?: string) =>
    new ApplicationError(
      ErrorCode.NOT_FOUND,
      `${resource} not found${id ? ` with id: ${id}` : ''}`,
      `The requested ${resource.toLowerCase()} could not be found.`
    ),

  unauthorized: (message = 'You must be logged in to access this resource') =>
    new ApplicationError(
      ErrorCode.UNAUTHORIZED,
      message,
      'Please log in to continue.'
    ),

  forbidden: (action: string) =>
    new ApplicationError(
      ErrorCode.FORBIDDEN,
      `User is not authorized to ${action}`,
      `You don't have permission to ${action}.`
    ),

  validation: (message: string, details?: unknown) =>
    new ApplicationError(
      ErrorCode.VALIDATION_ERROR,
      message,
      'Please check your input and try again.',
      details
    ),

  conflict: (resource: string, field: string) =>
    new ApplicationError(
      ErrorCode.CONFLICT,
      `${resource} with this ${field} already exists`,
      `A ${resource.toLowerCase()} with this ${field} already exists.`
    ),

  rateLimit: (retryAfter: number) =>
    new ApplicationError(
      ErrorCode.RATE_LIMIT_ERROR,
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      `You've made too many requests. Please try again in ${retryAfter} seconds.`
    ),

  subscriptionLimit: (feature: string, tier: string) =>
    new ApplicationError(
      ErrorCode.SUBSCRIPTION_ERROR,
      `Feature '${feature}' requires ${tier} subscription`,
      `Upgrade to ${tier} to access this feature.`
    ),

  database: (operation: string, error?: unknown) =>
    new ApplicationError(
      ErrorCode.DATABASE_ERROR,
      `Database error during ${operation}`,
      'A database error occurred. Please try again later.',
      error
    ),

  aiService: (operation: string, error?: unknown) =>
    new ApplicationError(
      ErrorCode.AI_SERVICE_ERROR,
      `AI service error during ${operation}`,
      'The AI service is temporarily unavailable. Please try again later.',
      error
    ),

  internal: (message: string, details?: unknown) =>
    new ApplicationError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      'An unexpected error occurred. Please try again later.',
      details
    ),
};

/**
 * Convert various error types to ApplicationError
 */
export function normalizeError(error: unknown): ApplicationError {
  // Already an ApplicationError
  if (error instanceof ApplicationError) {
    return error;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const field = (error.meta?.target as string[])?.[0] || 'field';
        return ErrorFactory.conflict('Resource', field);
      case 'P2025': // Record not found
        return ErrorFactory.notFound('Resource');
      case 'P2003': // Foreign key constraint
        return ErrorFactory.validation('Invalid reference to related resource');
      default:
        return ErrorFactory.database('operation', error);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ErrorFactory.validation('Invalid data provided', error.message);
  }

  // Standard Error
  if (error instanceof Error) {
    return ErrorFactory.internal(error.message, { stack: error.stack });
  }

  // Unknown error type
  return ErrorFactory.internal('An unknown error occurred', error);
}

/**
 * Convert ApplicationError to TRPCError for tRPC procedures
 */
export function toTRPCError(error: ApplicationError): TRPCError {
  const codeMap: Record<ErrorCode, TRPCError['code']> = {
    [ErrorCode.BAD_REQUEST]: 'BAD_REQUEST',
    [ErrorCode.UNAUTHORIZED]: 'UNAUTHORIZED',
    [ErrorCode.FORBIDDEN]: 'FORBIDDEN',
    [ErrorCode.NOT_FOUND]: 'NOT_FOUND',
    [ErrorCode.CONFLICT]: 'CONFLICT',
    [ErrorCode.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_CONTENT',
    [ErrorCode.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    [ErrorCode.VALIDATION_ERROR]: 'BAD_REQUEST',
    [ErrorCode.DATABASE_ERROR]: 'INTERNAL_SERVER_ERROR',
    [ErrorCode.AI_SERVICE_ERROR]: 'INTERNAL_SERVER_ERROR',
    [ErrorCode.RATE_LIMIT_ERROR]: 'TOO_MANY_REQUESTS',
    [ErrorCode.SUBSCRIPTION_ERROR]: 'FORBIDDEN',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'INTERNAL_SERVER_ERROR',
  };

  return new TRPCError({
    code: codeMap[error.code] || 'INTERNAL_SERVER_ERROR',
    message: error.userMessage || error.message,
    cause: error,
  });
}

/**
 * Error logging utility
 */
export class ErrorLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static log(error: ApplicationError, context?: Record<string, unknown>) {
    const logData = {
      timestamp: new Date().toISOString(),
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
      context,
    };

    if (this.isDevelopment) {
      console.error('Application Error:', logData);
    } else {
      // In production, you would send this to your logging service
      // e.g., Sentry, LogRocket, CloudWatch, etc.
      console.error(JSON.stringify(logData));
    }
  }

  static logInfo(message: string, data?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data);
    }
  }

  static logWarning(message: string, data?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.warn(`[WARNING] ${message}`, data);
    }
  }
}

/**
 * Async error handler wrapper for tRPC procedures
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = normalizeError(error);
      ErrorLogger.log(appError, { args });
      throw toTRPCError(appError);
    }
  }) as T;
}

/**
 * Validation helper
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined) {
    throw ErrorFactory.validation(`${fieldName} is required`);
  }
  return value;
}

/**
 * Permission check helper
 */
export function assertPermission(
  condition: boolean,
  action: string
): asserts condition {
  if (!condition) {
    throw ErrorFactory.forbidden(action);
  }
}

/**
 * Subscription tier check helper
 */
export function assertSubscriptionTier(
  userTier: string,
  requiredTier: 'free' | 'pro' | 'enterprise',
  feature: string
): void {
  const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] ?? 0;
  const requiredTierLevel = tierHierarchy[requiredTier];

  if (userTierLevel < requiredTierLevel) {
    throw ErrorFactory.subscriptionLimit(feature, requiredTier);
  }
}
