import { eq } from 'drizzle-orm';
import { users, organizationMembers, organizations } from '../../db/schema';
import { BaseAuthService } from './BaseAuthService';
import type { ServiceResponse } from '../../types';
import type { LoginData, LoginResponse } from '../../types/authTypes';

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
   */
  async getUserMemberships(userId: string): Promise<{
    organizations: Array<{ id: string; name: string; roleCode: number }>;
    projects: Array<{ id: string; name: string; roleCode: number }>;
  }> {
    try {
      // Fetch user's organizations
      const userOrganizations = await this.db
        .select({
          id: organizations.id,
          name: organizations.name,
          roleCode: organizationMembers.organizationRoleCode,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.userId, userId));

      // TODO: Fetch user's projects when projects table is created
      // const userProjects = await this.db
      //   .select({
      //     id: projects.id,
      //     name: projects.name,
      //     roleCode: projectMembers.projectRoleCode,
      //   })
      //   .from(projectMembers)
      //   .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      //   .where(eq(projectMembers.userId, userId));

      return {
        organizations: userOrganizations,
        projects: [], // TODO: Return userProjects when implemented
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
