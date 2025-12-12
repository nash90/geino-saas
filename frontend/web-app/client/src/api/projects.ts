import { apiClient } from './client';
import type { Project, ProjectWithMembers } from '../types/entities';
import type {
  PaginationParams,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddProjectMemberRequest,
} from '../types/api';

export const projectsApi = {
  list: async (params?: PaginationParams & { organizationId?: string }): Promise<{ projects: Project[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);
    
    const response = await apiClient.get(`/api/projects?${queryParams.toString()}`);
    return response.data;
  },

  get: async (id: string): Promise<{ project: ProjectWithMembers }> => {
    const response = await apiClient.get(`/api/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectRequest) => {
    const response = await apiClient.post('/api/projects', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProjectRequest) => {
    const response = await apiClient.patch(`/api/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/projects/${id}`);
    return response.data;
  },

  addMember: async (id: string, data: AddProjectMemberRequest) => {
    const response = await apiClient.post(`/api/projects/${id}/members`, data);
    return response.data;
  },

  removeMember: async (id: string, userId: string) => {
    const response = await apiClient.delete(`/api/projects/${id}/members/${userId}`);
    return response.data;
  },
};
