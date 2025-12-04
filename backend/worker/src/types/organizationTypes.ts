/**
 * Organization Domain Types
 * 
 * Domain-specific types for organization operations.
 * These types are used for API requests/responses and business logic.
 */

// ============================================================================
// Request Data Types
// ============================================================================

/**
 * Data for creating a new organization
 */
export interface OrganizationCreateData {
  name: string;
  description?: string;
  managerIds: string[]; // Array of user IDs to assign as Organization Managers
}

/**
 * Data for updating an organization
 */
export interface OrganizationUpdateData {
  name?: string;
  description?: string;
}

/**
 * Data for adding a member to an organization
 */
export interface AddMemberData {
  userId: string;
  organizationRoleCode: number; // 1: organization_manager
}

/**
 * Data for removing a member from an organization
 */
export interface RemoveMemberData {
  userId: string;
}

// ============================================================================
// Response Data Types
// ============================================================================

/**
 * Organization member data for responses
 */
export interface OrganizationMemberData {
  id: string;
  userId: string;
  organizationId: string;
  organizationRoleCode: number;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Organization role codes with metadata
 */
export const ORGANIZATION_ROLES = [
  { key: 'ORGANIZATION_MANAGER', value: 1, label: 'Organization Manager' },
] as const;

/**
 * Helper to get all valid organization role codes
 */
export const VALID_ORGANIZATION_ROLE_CODES: number[] = ORGANIZATION_ROLES.map(role => role.value);

/**
 * Helper to get organization role label by code
 */
export function getOrganizationRoleLabel(roleCode: number): string {
  const role = ORGANIZATION_ROLES.find(r => r.value === roleCode);
  return role?.label || 'Unknown Role';
}
