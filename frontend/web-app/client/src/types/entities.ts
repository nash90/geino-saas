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
