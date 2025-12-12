/**
 * Frontend Entity Types
 * 
 * Domain entities for the frontend application.
 */

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  systemRoleCode: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  organizationRoleCode: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  statusCode: number; // 1=active, 2=completed, 3=archived
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  projectRoleCode: number; // 1=project_manager, 2=geino_user, 3=genba_user
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

export interface ProjectWithMembers extends Project {
  members: ProjectMember[];
}
