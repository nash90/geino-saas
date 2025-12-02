/**
 * Code Types - Centralized role and status code definitions
 * 
 * This file contains all code constants used throughout the application
 * for roles, statuses, and other enumerated values.
 */

// ============================================================================
// System Role Codes
// ============================================================================

/**
 * System role codes with metadata
 */
export const SYSTEM_ROLES = [
  { key: 'SYSTEM_ADMIN', value: 1, label: 'System Admin' },
  { key: 'REGULAR_USER', value: 2, label: 'Regular User' },
] as const;

/**
 * Helper to get all valid system role codes
 */
export const VALID_SYSTEM_ROLE_CODES: number[] = SYSTEM_ROLES.map(role => role.value);

/**
 * Helper to get system role label by code
 */
export function getSystemRoleLabel(roleCode: number | null): string {
  if (roleCode === null) return 'No System Role';
  const role = SYSTEM_ROLES.find(r => r.value === roleCode);
  return role?.label || 'Unknown Role';
}

// ============================================================================
// Organization Role Codes
// ============================================================================

/**
 * Organization role codes with metadata
 */
export const ORGANIZATION_ROLES = [
  { key: 'ORGANIZATION_MANAGER', value: 1, label: 'Organization Manager' },
  { key: 'ORGANIZATION_MEMBER', value: 2, label: 'Organization Member' },
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

// ============================================================================
// Project Role Codes
// ============================================================================

/**
 * Project role codes with metadata
 */
export const PROJECT_ROLES = [
  { key: 'PROJECT_MANAGER', value: 1, label: 'Project Manager' },
  { key: 'GEINO_USER', value: 2, label: 'Geino User' },
  { key: 'GENBA_USER', value: 3, label: 'Genba User' },
] as const;

/**
 * Helper to get all valid project role codes
 */
export const VALID_PROJECT_ROLE_CODES: number[] = PROJECT_ROLES.map(role => role.value);

/**
 * Helper to get project role label by code
 */
export function getProjectRoleLabel(roleCode: number): string {
  const role = PROJECT_ROLES.find(r => r.value === roleCode);
  return role?.label || 'Unknown Role';
}

// ============================================================================
// Project Status Codes
// ============================================================================

/**
 * Project status codes with metadata
 */
export const PROJECT_STATUSES = [
  { key: 'ACTIVE', value: 1, label: 'Active' },
  { key: 'COMPLETED', value: 2, label: 'Completed' },
  { key: 'ARCHIVED', value: 3, label: 'Archived' },
] as const;

/**
 * Helper to get all valid project status codes
 */
export const VALID_PROJECT_STATUS_CODES: number[] = PROJECT_STATUSES.map(status => status.value);

/**
 * Helper to get project status label by code
 */
export function getProjectStatusLabel(statusCode: number): string {
  const status = PROJECT_STATUSES.find(s => s.value === statusCode);
  return status?.label || 'Unknown Status';
}

// ============================================================================
// Type Exports for Type Safety
// ============================================================================

export type SystemRoleCode = typeof SYSTEM_ROLES[number]['value'];
export type OrganizationRoleCode = typeof ORGANIZATION_ROLES[number]['value'];
export type ProjectRoleCode = typeof PROJECT_ROLES[number]['value'];
export type ProjectStatusCode = typeof PROJECT_STATUSES[number]['value'];

// ============================================================================
// Constant Value Exports (for backward compatibility and convenience)
// ============================================================================

export const SystemRole = {
  SYSTEM_ADMIN: SYSTEM_ROLES[0].value,
  REGULAR_USER: SYSTEM_ROLES[1].value,
} as const;

export const OrganizationRole = {
  ORGANIZATION_MANAGER: ORGANIZATION_ROLES[0].value,
  ORGANIZATION_MEMBER: ORGANIZATION_ROLES[1].value,
} as const;

export const ProjectRole = {
  PROJECT_MANAGER: PROJECT_ROLES[0].value,
  GEINO_USER: PROJECT_ROLES[1].value,
  GENBA_USER: PROJECT_ROLES[2].value,
} as const;

export const ProjectStatus = {
  ACTIVE: PROJECT_STATUSES[0].value,
  COMPLETED: PROJECT_STATUSES[1].value,
  ARCHIVED: PROJECT_STATUSES[2].value,
} as const;
