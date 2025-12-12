import { eq, inArray } from 'drizzle-orm';
import { users, organizationMembers, organizations, projects, projectMembers } from '../../db/schema';
import { BaseAuthService } from './BaseAuthService';
import type { ServiceResponse } from '../../types';
import type { LoginData, LoginResponse } from '../../types/authTypes';
import { SystemRole, OrganizationRole, ProjectRole } from '../../types/codeTypes';

/**
 * Login Service
 * 
 * Handles user authentication:
 * - Validates login credentials
 * - Authenticates with Supabase
 * - Fetches user profile
 * - Returns tokens
 */
export class LoginService extends BaseAuthService {
  /**
   * Login user with email and password
   */
  async login(data: LoginData): Promise<ServiceResponse<LoginResponse>> {
    try {
      // Validate login data
      const validation = this.validationService.validateLoginData(data);
      if (!validation.valid) {
        return this.error(validation.error!, 'VALIDATION_ERROR');
      }

      // Sign in with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError || !authData.user || !authData.session) {
        console.error('[LoginService.login] Auth Error:', authError);
        return this.error(authError?.message || 'Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Fetch user profile from custom users table
      const userProfile = await this.db.query.users.findFirst({
        where: eq(users.id, authData.user.id)
      });

      if (!userProfile) {
        return this.error('User profile not found', 'USER_NOT_FOUND');
      }

      return this.success({
        user: userProfile,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      });
    } catch (error) {
      return this.handleError(error, 'LoginService.login');
    }
  }

  /**
   * Get user's organization and project memberships
   * Returns organizations and projects the user belongs to
   *
   * Access Rules:
   * - System Admin: All organizations and all projects (with org manager and PM privileges)
   * - Organization Manager: All projects in their organizations (with projectRoleCode = 1)
   * - Regular Users: Only organizations and projects they are explicitly members of
   */
  async getUserMemberships(userId: string): Promise<{
    organizations: Array<{ id: string; name: string; organizationRoleCode: number }>;
    projects: Array<{ id: string; name: string; organizationId: string; projectRoleCode: number }>;
  }> {
    try {
      // Get user's system role
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { systemRoleCode: true }
      });

      let userOrganizations: Array<{ id: string; name: string; organizationRoleCode: number }> = [];

      // System Admin: Return ALL organizations with Organization Manager privileges
      if (user?.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) {
        const allOrgs = await this.db
          .select({
            id: organizations.id,
            name: organizations.name,
          })
          .from(organizations);

        userOrganizations = allOrgs.map(org => ({
          ...org,
          organizationRoleCode: OrganizationRole.ORGANIZATION_MANAGER.code, // System Admin gets Org Manager privileges
        }));
      } else {
        // Regular users: Fetch organizations where they are members
        userOrganizations = await this.db
          .select({
            id: organizations.id,
            name: organizations.name,
            organizationRoleCode: organizationMembers.organizationRoleCode,
          })
          .from(organizationMembers)
          .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
          .where(eq(organizationMembers.userId, userId));
      }

      let userProjects: Array<{
        id: string;
        name: string;
        organizationId: string;
        projectRoleCode: number;
      }> = [];

      // System Admin: Return ALL projects with PM privileges
      if (user?.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) {
        const allProjects = await this.db
          .select({
            id: projects.id,
            name: projects.name,
            organizationId: projects.organizationId,
          })
          .from(projects);

        userProjects = allProjects.map(p => ({
          ...p,
          projectRoleCode: ProjectRole.PROJECT_MANAGER.code, // System Admin gets PM privileges on all projects
        }));
      } else {
        // Get organization IDs where user is an Organization Manager
        const managedOrgIds = userOrganizations
          .filter(org => org.organizationRoleCode === OrganizationRole.ORGANIZATION_MANAGER.code)
          .map(org => org.id);

        // Fetch projects where user is a direct member
        const directMemberProjects = await this.db
          .select({
            id: projects.id,
            name: projects.name,
            organizationId: projects.organizationId,
            projectRoleCode: projectMembers.projectRoleCode,
          })
          .from(projectMembers)
          .innerJoin(projects, eq(projectMembers.projectId, projects.id))
          .where(eq(projectMembers.userId, userId));

        // If user is an Organization Manager, fetch ALL projects in those organizations
        let orgManagerProjects: Array<{
          id: string;
          name: string;
          organizationId: string;
          projectRoleCode: number;
        }> = [];

        if (managedOrgIds.length > 0) {
          // Get all projects in managed organizations using inArray
          const allOrgProjects = await this.db
            .select({
              id: projects.id,
              name: projects.name,
              organizationId: projects.organizationId,
            })
            .from(projects)
            .where(inArray(projects.organizationId, managedOrgIds));

          // Organization Managers get PM privileges on their org's projects
          orgManagerProjects = allOrgProjects.map(p => ({
            ...p,
            projectRoleCode: ProjectRole.PROJECT_MANAGER.code, // Org Manager gets PM privileges
          }));
        }

        // Combine and deduplicate projects (prioritize higher role)
        const projectMap = new Map<string, typeof userProjects[0]>();

        // Add direct memberships first
        directMemberProjects.forEach(p => {
          projectMap.set(p.id, p);
        });

        // Add org manager projects (will override if higher privilege)
        orgManagerProjects.forEach(p => {
          const existing = projectMap.get(p.id);
          if (!existing || p.projectRoleCode < existing.projectRoleCode) {
            projectMap.set(p.id, p); // Lower code = higher privilege (1=PM is highest)
          }
        });

        userProjects = Array.from(projectMap.values());
      }

      return {
        organizations: userOrganizations,
        projects: userProjects,
      };
    } catch (error) {
      console.error('[LoginService.getUserMemberships] Error:', error);
      return {
        organizations: [],
        projects: [],
      };
    }
  }
}
