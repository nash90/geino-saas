import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse, PaginationParams, PaginatedResponse } from '../../types';

/**
 * Base service class providing common functionality for all services
 * 
 * Features:
 * - Database access
 * - Environment variables
 * - Timestamp generation
 * - Error handling
 * - Transaction support
 */
export abstract class BaseService {
  protected db: DbClient;
  protected env: Env;

  constructor(db: DbClient, env: Env) {
    this.db = db;
    this.env = env;
  }

  /**
   * Get current timestamp
   */
  protected getCurrentTimestamp(): Date {
    return new Date();
  }

  /**
   * Calculate pagination offset
   */
  protected calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Calculate total pages
   */
  protected calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  /**
   * Validate and normalize pagination parameters
   */
  protected normalizePaginationParams(page?: string | number, limit?: string | number): PaginationParams {
    const normalizedPage = Math.max(1, parseInt(String(page || '1')));
    const normalizedLimit = Math.min(100, Math.max(1, parseInt(String(limit || '10'))));
    
    return {
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  /**
   * Handle errors consistently across all services
   */
  protected handleError(error: unknown, operation: string): ServiceResponse {
    console.error(`[${operation}] Error:`, error);
    
    // Extract error message
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage,
      code: 'SERVICE_ERROR',
    };
  }

  /**
   * Create a success response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create an error response
   */
  protected error(message: string, code?: string): ServiceResponse {
    return {
      success: false,
      error: message,
      code: code || 'ERROR',
    };
  }

  /**
   * Execute a database transaction
   * Override this method in child classes if transaction support is needed
   */
  protected async withTransaction<T>(
    callback: (db: DbClient) => Promise<T>
  ): Promise<T> {
    // For now, execute directly
    // In future, implement proper transaction wrapper with Drizzle
    return callback(this.db);
  }
}
