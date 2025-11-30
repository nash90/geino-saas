import { BaseService } from '../base/BaseService';
import { ValidationService } from '../validation/ValidationService';
import type { DbClient } from '../../db/client';
import type { Env } from '../../types';
import { VALID_ORGANIZATION_ROLE_CODES } from '../../types/organizationTypes';

/**
 * Base Organization Service
 * 
 * Provides common functionality for all organization-related services:
 * - Validation service access
 * - Common organization utilities
 */
export abstract class BaseOrganizationService extends BaseService {
  protected validationService: ValidationService;

  constructor(db: DbClient, env: Env) {
    super(db, env);
    this.validationService = new ValidationService();
  }

  /**
   * Validate organization ID format
   */
  protected validateOrganizationId(id: string): boolean {
    const result = this.validationService.validateUserId(id); // UUID validation
    return result.valid;
  }

  /**
   * Validate organization role code
   */
  protected validateOrganizationRoleCode(roleCode: number): boolean {
    return VALID_ORGANIZATION_ROLE_CODES.includes(roleCode);
  }
}
