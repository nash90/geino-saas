import { BaseService } from '../base/BaseService';
import { ValidationService } from '../validation/ValidationService';
import { createClient } from '@supabase/supabase-js';
import type { DbClient } from '../../db/client';
import type { Env } from '../../types';

/**
 * Base User Service
 * 
 * Provides common functionality for all user-related services:
 * - Validation service access
 * - Supabase client for auth operations
 * - Common user utilities
 */
export abstract class BaseUserService extends BaseService {
  protected validationService: ValidationService;

  constructor(db: DbClient, env: Env) {
    super(db, env);
    this.validationService = new ValidationService();
  }

  /**
   * Create Supabase client for auth operations
   * Only create when needed to avoid unnecessary initialization
   */
  protected createSupabaseClient() {
    return createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
}
