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
  search?: string;
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

// ============================================================================
// Project API Types
// ============================================================================

export interface CreateProjectRequest {
  organizationId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  members?: Array<{
    userId: string;
    projectRoleCode: number; // 1=project_manager, 2=geino_user, 3=genba_user
  }>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusCode?: number; // 1=active, 2=completed, 3=archived
}

export interface AddProjectMemberRequest {
  userId: string;
  projectRoleCode: number; // 1=project_manager, 2=geino_user, 3=genba_user
}

// ============================================================================
// Task API Types
// ============================================================================

export interface ListTasksParams extends PaginationParams {
  statusCode?: number;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  statusCode?: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  deadline?: string; // ISO date string
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  statusCode?: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  deadline?: string; // ISO date string
}

export interface UpdateTaskStatusRequest {
  statusCode: number;
}

// ============================================================================
// Comment API Types
// ============================================================================

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ============================================================================
// Calendar API Types
// ============================================================================

export interface CalendarTasksParams {
  projectIds: string[]; // Array of project IDs
  fromDate: string; // ISO date string
  toDate: string; // ISO date string
}

export interface CalendarTasksResponse {
  date: string;
  tasks: import('./entities').TaskWithDetails[];
}

// ============================================================================
// Upload API Types
// ============================================================================

export interface GenerateUploadUrlRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  taskId?: string;
  commentId?: string;
}

export interface GenerateUploadUrlResponse {
  uploadId: string;
  uploadUrl: string;
  fileKey: string;
}

export interface ConfirmUploadRequest {
  uploadId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  taskId?: string;
  commentId?: string;
}

export interface GetDownloadUrlResponse {
  downloadUrl: string;
}
