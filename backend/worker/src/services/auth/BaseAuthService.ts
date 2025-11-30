import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BaseService } from '../base/BaseService';
import { ValidationService } from '../validation/ValidationService';

/**
 * Base Auth Service
 * 
 * Provides common functionality for all auth-related services:
 * - Supabase client initialization
 * - Validation service access
 * - Common auth utilities
 */
export abstract class BaseAuthService extends BaseService {
  protected validationService: ValidationService;
  protected supabase: SupabaseClient;

  constructor(db: any, env: any) {
    super(db, env);
    this.validationService = new ValidationService();
    
    // Initialize Supabase client with service role key for admin operations
    this.supabase = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
}
