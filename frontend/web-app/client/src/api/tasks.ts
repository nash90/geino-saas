import { apiClient } from './client';
import type {
  Task,
  TaskWithDetails,
  TaskWithComments,
  TaskComment,
  TaskCommentWithUser,
} from '../types/entities';
import type {
  PaginatedResponse,
  ListTasksParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  CalendarTasksParams,
  CalendarTasksResponse,
} from '../types/api';

export const tasksApi = {
  // ============================================================================
  // Task CRUD Operations
  // ============================================================================

  /**
   * List tasks for a project with pagination and filtering
   */
  list: async (
    projectId: string,
    params?: ListTasksParams
  ): Promise<{ tasks: TaskWithDetails[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.statusCode) queryParams.append('statusCode', params.statusCode.toString());
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);

    const response = await apiClient.get(
      `/api/projects/${projectId}/tasks?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single task with full details including comments
   */
  get: async (taskId: string): Promise<TaskWithComments> => {
    const response = await apiClient.get(`/api/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Create a new task
   */
  create: async (
    projectId: string,
    data: CreateTaskRequest
  ): Promise<{ message: string; task: Task }> => {
    const response = await apiClient.post(`/api/projects/${projectId}/tasks`, data);
    return response.data;
  },

  /**
   * Update an existing task
   */
  update: async (
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<{ message: string; task: Task }> => {
    const response = await apiClient.patch(`/api/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * Update task status only (for drag-and-drop)
   */
  updateStatus: async (
    taskId: string,
    statusCode: number
  ): Promise<{ message: string; task: Task }> => {
    const response = await apiClient.patch(`/api/tasks/${taskId}/status`, { statusCode });
    return response.data;
  },

  /**
   * Delete a task
   */
  delete: async (taskId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Duplicate a task
   */
  duplicate: async (taskId: string): Promise<{ message: string; task: Task }> => {
    const response = await apiClient.post(`/api/tasks/${taskId}/duplicate`);
    return response.data;
  },

  // ============================================================================
  // Comment Operations
  // ============================================================================

  /**
   * List all comments for a task
   */
  listComments: async (taskId: string): Promise<{ comments: TaskCommentWithUser[] }> => {
    const response = await apiClient.get(`/api/tasks/${taskId}/comments`);
    return response.data;
  },

  /**
   * Add a comment to a task
   */
  addComment: async (
    taskId: string,
    data: CreateCommentRequest
  ): Promise<{ message: string; comment: TaskComment }> => {
    const response = await apiClient.post(`/api/tasks/${taskId}/comments`, data);
    return response.data;
  },

  /**
   * Update a comment (owner only)
   */
  updateComment: async (
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<{ message: string; comment: TaskComment }> => {
    const response = await apiClient.patch(`/api/comments/${commentId}`, data);
    return response.data;
  },

  /**
   * Delete a comment (owner or PM+)
   */
  deleteComment: async (commentId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/comments/${commentId}`);
    return response.data;
  },

  // ============================================================================
  // Calendar Operations
  // ============================================================================

  /**
   * Get tasks for calendar view grouped by date
   */
  getCalendarTasks: async (
    params: CalendarTasksParams
  ): Promise<{ calendarTasks: CalendarTasksResponse[] }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('projectIds', params.projectIds.join(','));
    queryParams.append('fromDate', params.fromDate);
    queryParams.append('toDate', params.toDate);

    const response = await apiClient.get(`/api/calendar/tasks?${queryParams.toString()}`);
    return response.data;
  },
};
