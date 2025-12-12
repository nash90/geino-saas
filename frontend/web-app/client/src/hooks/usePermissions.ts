import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for checking user permissions
 * Provides helper functions for role-based access control
 */
export function usePermissions() {
  const { user, organizations, projects } = useAuth();

  /**
   * Check if user is System Admin
   */
  const isSystemAdmin = (): boolean => {
    return user?.systemRoleCode === 1;
  };

  /**
   * Check if user is Organization Manager or above for a specific organization
   * Includes: System Admin, Organization Manager
   */
  const isOrganizationManagerOrAbove = (organizationId: string): boolean => {
    // System Admin has access to everything
    if (isSystemAdmin()) return true;

    // Check if user is Organization Manager of this organization
    const org = organizations.find((o) => o.id === organizationId);
    return org?.organizationRoleCode === 1; // 1 = organization_manager
  };

  /**
   * Check if user is Project Manager or above for a specific project
   * Includes: System Admin, Organization Manager (of project's org), Project Manager
   */
  const isProjectManagerOrAbove = (projectId: string): boolean => {
    // System Admin has access to everything
    if (isSystemAdmin()) return true;

    // Get the project
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;

    // Check if user is Organization Manager of the project's organization
    if (isOrganizationManagerOrAbove(project.organizationId)) return true;

    // Check if user is Project Manager of this project
    return project.projectRoleCode === 1; // 1 = project_manager
  };

  /**
   * Check if user is any member of a project (any role)
   */
  const isProjectMember = (projectId: string): boolean => {
    if (isSystemAdmin()) return true;
    return projects.some((p) => p.id === projectId);
  };

  /**
   * Check if user is any member of an organization (any role)
   */
  const isOrganizationMember = (organizationId: string): boolean => {
    if (isSystemAdmin()) return true;
    return organizations.some((o) => o.id === organizationId);
  };

  /**
   * Get user's role code for a specific project
   */
  const getProjectRole = (projectId: string): number | null => {
    const project = projects.find((p) => p.id === projectId);
    return project?.projectRoleCode || null;
  };

  /**
   * Get user's role code for a specific organization
   */
  const getOrganizationRole = (organizationId: string): number | null => {
    const org = organizations.find((o) => o.id === organizationId);
    return org?.organizationRoleCode || null;
  };

  return {
    isSystemAdmin,
    isOrganizationManagerOrAbove,
    isProjectManagerOrAbove,
    isProjectMember,
    isOrganizationMember,
    getProjectRole,
    getOrganizationRole,
  };
}
