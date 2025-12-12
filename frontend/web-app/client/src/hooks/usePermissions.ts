import { useAuth } from '@/contexts/AuthContext';
import type { Task } from '@/types/entities';
import { TaskStatus, SystemRole, OrganizationRole, ProjectRole } from '@/types/entities';

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
    return user?.systemRoleCode === SystemRole.SYSTEM_ADMIN.code;
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
    return org?.organizationRoleCode === OrganizationRole.ORGANIZATION_MANAGER.code;
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
    return project.projectRoleCode === ProjectRole.PROJECT_MANAGER.code;
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

  // ============================================================================
  // Task Permissions
  // ============================================================================

  /**
   * Check if user can create a task in a project
   * - System Admin: Can create any task
   * - Organization Manager: Can create any task in org projects
   * - Project Manager: Can create any task in their projects
   * - Genba User (role 3): Can create Hold status tasks only
   * - Geino User (role 2): Cannot create tasks
   */
  const canCreateTask = (projectId: string, statusCode?: number): boolean => {
    // System Admin can create any task
    if (isSystemAdmin()) return true;

    // Get project
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;

    // Check if user is Organization Manager
    if (isOrganizationManagerOrAbove(project.organizationId)) return true;

    // Check project role
    const projectRole = getProjectRole(projectId);
    if (!projectRole) return false;

    // Project Manager can create any task
    if (projectRole === ProjectRole.PROJECT_MANAGER.code) return true;

    // Genba User can only create Hold status tasks
    if (projectRole === ProjectRole.GENBA_USER.code) {
      return statusCode === TaskStatus.HOLD.code || statusCode === undefined;
    }

    // Geino User cannot create tasks
    return false;
  };

  /**
   * Check if user can edit a task
   * - System Admin: Can edit any task
   * - Organization Manager: Can edit any task in org projects
   * - Project Manager: Can edit any task in their projects
   * - Genba User (role 3): Can edit only their own tasks
   * - Geino User (role 2): Cannot edit tasks
   */
  const canEditTask = (task: Task): boolean => {
    // System Admin can edit any task
    if (isSystemAdmin()) return true;

    // Get project
    const project = projects.find((p) => p.id === task.projectId);
    if (!project) return false;

    // Check if user is Organization Manager
    if (isOrganizationManagerOrAbove(project.organizationId)) return true;

    // Check project role
    const projectRole = getProjectRole(task.projectId);
    if (!projectRole) return false;

    // Project Manager can edit any task
    if (projectRole === ProjectRole.PROJECT_MANAGER.code) return true;

    // Genba User can edit only their own tasks
    if (projectRole === ProjectRole.GENBA_USER.code && task.createdBy === user?.id) return true;

    // Geino User cannot edit tasks
    return false;
  };

  /**
   * Check if user can change task status
   * - System Admin: Can change any task status
   * - Organization Manager: Can change any task status in org projects
   * - Project Manager: Can change any task status in their projects
   * - Genba User (role 3): CANNOT change task status (can only edit other fields)
   * - Geino User (role 2): Cannot change task status
   */
  const canChangeTaskStatus = (task: Task): boolean => {
    // System Admin can change any task status
    if (isSystemAdmin()) return true;

    // Get project
    const project = projects.find((p) => p.id === task.projectId);
    if (!project) return false;

    // Check if user is Organization Manager
    if (isOrganizationManagerOrAbove(project.organizationId)) return true;

    // Check project role
    const projectRole = getProjectRole(task.projectId);
    if (!projectRole) return false;

    // Only Project Manager can change task status
    // Genba User cannot change status even for their own tasks
    return projectRole === ProjectRole.PROJECT_MANAGER.code;
  };

  /**
   * Check if user can delete a task
   * Only Project Managers or above can delete tasks
   */
  const canDeleteTask = (projectId: string): boolean => {
    return isProjectManagerOrAbove(projectId);
  };

  /**
   * Check if user can view tasks in a project
   * Any project member can view tasks
   */
  const canViewTasks = (projectId: string): boolean => {
    return isProjectMember(projectId);
  };

  /**
   * Check if user can view/edit their own comments
   */
  const canEditComment = (commentUserId: string): boolean => {
    return user?.id === commentUserId;
  };

  /**
   * Check if user can delete a comment
   * Owner or Project Manager+ can delete comments
   */
  const canDeleteComment = (commentUserId: string, projectId: string): boolean => {
    if (user?.id === commentUserId) return true;
    return isProjectManagerOrAbove(projectId);
  };

  return {
    isSystemAdmin,
    isOrganizationManagerOrAbove,
    isProjectManagerOrAbove,
    isProjectMember,
    isOrganizationMember,
    getProjectRole,
    getOrganizationRole,
    // Task permissions
    canCreateTask,
    canEditTask,
    canChangeTaskStatus,
    canDeleteTask,
    canViewTasks,
    canEditComment,
    canDeleteComment,
  };
}
