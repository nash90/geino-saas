import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse } from '../../types';

/**
 * Base Project Service
 * 
 * Provides common utilities for project services:
 * - Database access
 * - Environment variables
 * - Error handling
 * - Response formatting
 * - Validation helpers
 */
export abstract class BaseProjectService {
  protected db: DbClient;
  protected env: Env;

  constructor(db: DbClient, env: Env) {
    this.db = db;
    this.env = env;
  }

  /**
   * Create success response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create error response
   */
  protected error(error: string, code?: string): ServiceResponse<never> {
    return {
      success: false,
      error,
      code,
    };
  }

  /**
   * Handle unexpected errors
   */
  protected handleError(error: unknown, context: string): ServiceResponse<never> {
    console.error(`[${context}] Error:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return this.error(message, 'INTERNAL_ERROR');
  }

  /**
   * Validate UUID format
   */
  protected validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validate project role code
   * 1: project_manager, 2: geino_user, 3: genba_user
   */
  protected validateProjectRoleCode(code: number): boolean {
    return [1, 2, 3].includes(code);
  }

  /**
   * Validate project status code
   * 1: active, 2: completed, 3: archived
   */
  protected validateProjectStatusCode(code: number): boolean {
    return [1, 2, 3].includes(code);
  }

  /**
   * Normalize pagination parameters
   */
  protected normalizePaginationParams(page: number, limit: number) {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);
    return { page: normalizedPage, limit: normalizedLimit };
  }

  /**
   * Calculate pagination offset
   */
  protected calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
