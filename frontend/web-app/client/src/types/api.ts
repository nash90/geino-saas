/**
 * Frontend API Request/Response Types
 * 
 * Types for API requests and responses.
 */

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Organization API Types
// ============================================================================

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  managerIds: string[];
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

export interface AddMemberRequest {
  userId: string;
  organizationRoleCode?: number; // Defaults to 1 (organization_manager)
}
