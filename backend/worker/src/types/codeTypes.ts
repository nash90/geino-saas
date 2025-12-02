/**
 * Code Types - Centralized role and status code definitions
 * 
 * This file contains all code constants used throughout the application
 * for roles, statuses, and other enumerated values.
 */

// ============================================================================
// System Role Codes
// ============================================================================

export const SystemRole = {
  SYSTEM_ADMIN: { code: 1, label: 'System Admin', key: 'system_admin' },
  REGULAR_USER: { code: 2, label: 'Regular User', key: 'regular_user' }
} as const;

export const VALID_SYSTEM_ROLE_CODES: number[] = Object.values(SystemRole).map(role => role.code);

export function getSystemRoleLabel(roleCode: number | null): string {
  if (roleCode === null) return 'No System Role';
  const role = Object.values(SystemRole).find(r => r.code === roleCode);
  return role?.label || 'Unknown Role';
}

// ============================================================================
// Organization Role Codes
// ============================================================================

export const OrganizationRole = {
  ORGANIZATION_MANAGER: { code: 1, label: 'Organization Manager', key: 'organization_manager' },
  ORGANIZATION_MEMBER: { code: 2, label: 'Organization Member', key: 'organization_member' }
} as const;

export const VALID_ORGANIZATION_ROLE_CODES: number[] = Object.values(OrganizationRole).map(role => role.code);

export function getOrganizationRoleLabel(roleCode: number): string {
  const role = Object.values(OrganizationRole).find(r => r.code === roleCode);
  return role?.label || 'Unknown Role';
}

// ============================================================================
// Project Role Codes
// ============================================================================

export const ProjectRole = {
  PROJECT_MANAGER: { code: 1, label: 'Project Manager', key: 'project_manager' },
  GEINO_USER: { code: 2, label: 'Geino User', key: 'geino_user' },
  GENBA_USER: { code: 3, label: 'Genba User', key: 'genba_user' }
} as const;

export const VALID_PROJECT_ROLE_CODES: number[] = Object.values(ProjectRole).map(role => role.code);

export function getProjectRoleLabel(roleCode: number): string {
  const role = Object.values(ProjectRole).find(r => r.code === roleCode);
  return role?.label || 'Unknown Role';
}

// ============================================================================
// Project Status Codes
// ============================================================================

export const ProjectStatus = {
  ACTIVE: { code: 1, label: 'Active', key: 'active' },
  COMPLETED: { code: 2, label: 'Completed', key: 'completed' },
  ARCHIVED: { code: 3, label: 'Archived', key: 'archived' }
} as const;

export const VALID_PROJECT_STATUS_CODES: number[] = Object.values(ProjectStatus).map(status => status.code);

export function getProjectStatusLabel(statusCode: number): string {
  const status = Object.values(ProjectStatus).find(s => s.code === statusCode);
  return status?.label || 'Unknown Status';
}

// ============================================================================
// Type Exports for Type Safety
// ============================================================================

export type SystemRoleCode = typeof SystemRole[keyof typeof SystemRole]['code'];
export type OrganizationRoleCode = typeof OrganizationRole[keyof typeof OrganizationRole]['code'];
export type ProjectRoleCode = typeof ProjectRole[keyof typeof ProjectRole]['code'];
export type ProjectStatusCode = typeof ProjectStatus[keyof typeof ProjectStatus]['code'];
