import { BaseProjectService } from './BaseProjectService';
import { projects, projectMembers, users, organizations } from '../../db/schema';
import { eq, sql, desc, and, or } from 'drizzle-orm';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
} from '../../types';

export interface ProjectListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  statusCode: number;
  createdAt: Date;
}

export interface ProjectMemberWithUser {
  id: string;
  projectId: string;
  userId: string;
  projectRoleCode: number;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

export interface ProjectWithMembers {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  statusCode: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: ProjectMemberWithUser[];
}

/**
 * Project Query Service
 * 
 * Handles project read operations with pagination and filtering.
 */
export class ProjectQueryService extends BaseProjectService {
  /**
   * List projects with pagination
   * System Admin sees all projects
   * Organization Managers see projects in their organizations
   * Project members see only their assigned projects
   */
  async listProjects(
    params: PaginationParams,
    userId: string,
    isSystemAdmin: boolean,
    organizationId?: string
  ): Promise<ServiceResponse<PaginatedResponse<ProjectListItem>>> {
    try {
      const normalizedParams = this.normalizePaginationParams(params.page, params.limit);
      const limit = normalizedParams.limit;
      const offset = this.calculateOffset(normalizedParams.page, normalizedParams.limit);

      // Build base query
      const baseQuery = this.db.select({
        id: projects.id,
        organizationId: projects.organizationId,
        organizationName: organizations.name,
        name: projects.name,
        description: projects.description,
        startDate: projects.startDate,
        endDate: projects.endDate,
        statusCode: projects.statusCode,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .innerJoin(organizations, eq(projects.organizationId, organizations.id));

      const baseCountQuery = this.db.select({ count: sql<number>`count(*)` }).from(projects);

      let items;
      let total;

      if (isSystemAdmin) {
        // System Admin: all projects, optionally filtered by organization
        if (organizationId) {
          const [countResult, queryResult] = await Promise.all([
            baseCountQuery.where(eq(projects.organizationId, organizationId)),
            baseQuery
              .where(eq(projects.organizationId, organizationId))
              .orderBy(desc(projects.createdAt))
              .limit(limit)
              .offset(offset)
          ]);
          total = Number(countResult[0]?.count || 0);
          items = queryResult as ProjectListItem[];
        } else {
          const [countResult, queryResult] = await Promise.all([
            baseCountQuery,
            baseQuery
              .orderBy(desc(projects.createdAt))
              .limit(limit)
              .offset(offset)
          ]);
          total = Number(countResult[0]?.count || 0);
          items = queryResult as ProjectListItem[];
        }
      } else {
        // Non-admin: projects where user is org manager or project member
        const [countResult, queryResult] = await Promise.all([
          this.db.select({ count: sql<number>`count(DISTINCT projects.id)` })
            .from(projects)
            .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
            .leftJoin(organizations, eq(projects.organizationId, organizations.id))
            .leftJoin(
              sql`organization_members`,
              and(
                sql`organization_members.organization_id = projects.organization_id`,
                sql`organization_members.user_id = ${userId}`,
                sql`organization_members.organization_role_code = 1`
              )
            )
            .where(
              or(
                eq(projectMembers.userId, userId),
                sql`organization_members.id IS NOT NULL`
              )
            ),
          this.db.select({
            id: projects.id,
            organizationId: projects.organizationId,
            organizationName: organizations.name,
            name: projects.name,
            description: projects.description,
            startDate: projects.startDate,
            endDate: projects.endDate,
            statusCode: projects.statusCode,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .innerJoin(organizations, eq(projects.organizationId, organizations.id))
          .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
          .leftJoin(
            sql`organization_members`,
            and(
              sql`organization_members.organization_id = projects.organization_id`,
              sql`organization_members.user_id = ${userId}`,
              sql`organization_members.organization_role_code = 1`
            )
          )
          .where(
            or(
              eq(projectMembers.userId, userId),
              sql`organization_members.id IS NOT NULL`
            )
          )
          .groupBy(
            projects.id,
            organizations.id,
            organizations.name
          )
          .orderBy(desc(projects.createdAt))
          .limit(limit)
          .offset(offset)
        ]);

        total = Number(countResult[0]?.count || 0);
        items = queryResult as ProjectListItem[];
      }

      return this.success({
        items,
        pagination: {
          page: normalizedParams.page,
          limit: normalizedParams.limit,
          total,
          totalPages: Math.ceil(total / normalizedParams.limit),
        },
      });
    } catch (error) {
      return this.handleError(error, 'Failed to list projects');
    }
  }

  /**
   * Get project by ID with members
   */
  async getProjectById(
    projectId: string
  ): Promise<ServiceResponse<ProjectWithMembers>> {
    try {
      if (!this.validateUUID(projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      // Get project details with organization name
      const project = await this.db
        .select({
          id: projects.id,
          organizationId: projects.organizationId,
          organizationName: organizations.name,
          name: projects.name,
          description: projects.description,
          startDate: projects.startDate,
          endDate: projects.endDate,
          statusCode: projects.statusCode,
          createdBy: projects.createdBy,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .innerJoin(organizations, eq(projects.organizationId, organizations.id))
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project || project.length === 0) {
        return this.error('Project not found', 'NOT_FOUND');
      }

      // Get project members with user details
      const members = await this.db
        .select({
          id: projectMembers.id,
          projectId: projectMembers.projectId,
          userId: projectMembers.userId,
          projectRoleCode: projectMembers.projectRoleCode,
          createdAt: projectMembers.createdAt,
          user: {
            id: users.id,
            email: users.email,
            firstname: users.firstname,
            lastname: users.lastname,
          },
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId));

      return this.success({
        ...project[0],
        members: members as ProjectMemberWithUser[],
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get project');
    }
  }
}
