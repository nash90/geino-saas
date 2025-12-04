import { apiClient } from './client';
import type { Organization, OrganizationWithMembers } from '../types/entities';
import type {
  PaginationParams,
  PaginatedResponse,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  AddMemberRequest,
} from '../types/api';

export const organizationsApi = {
  list: async (params?: PaginationParams): Promise<{ organizations: Organization[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get(`/api/organizations?${queryParams.toString()}`);
    return response.data;
  },

  get: async (id: string): Promise<{ organization: OrganizationWithMembers }> => {
    const response = await apiClient.get(`/api/organizations/${id}`);
    return response.data;
  },

  create: async (data: CreateOrganizationRequest) => {
    const response = await apiClient.post('/api/organizations', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOrganizationRequest) => {
    const response = await apiClient.patch(`/api/organizations/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/organizations/${id}`);
    return response.data;
  },

  addMember: async (id: string, data: AddMemberRequest) => {
    const response = await apiClient.post(`/api/organizations/${id}/members`, data);
    return response.data;
  },

  removeMember: async (id: string, userId: string) => {
    const response = await apiClient.delete(`/api/organizations/${id}/members/${userId}`);
    return response.data;
  },
};
