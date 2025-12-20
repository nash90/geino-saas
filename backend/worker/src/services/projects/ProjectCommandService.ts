import { BaseProjectService } from './BaseProjectService';
import { projects, projectMembers, users, organizations } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { ServiceResponse } from '../../types';
import { NotificationType } from '../../types/notificationTypes';

export interface CreateProjectData {
  organizationId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  members?: Array<{ userId: string; projectRoleCode: number }>;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  statusCode?: number;
}

/**
 * Project Command Service
 * 
 * Handles project write operations (create, update, delete).
 * Access control is enforced in handlers.
 */
export class ProjectCommandService extends BaseProjectService {
  /**
   * Create a new project
   * Organization Manager or System Admin only
   */
  async createProject(
    data: CreateProjectData
  ): Promise<ServiceResponse<{ id: string }>> {
    try {
      // Validate organization ID
      if (!this.validateUUID(data.organizationId)) {
        return this.error('Invalid organization ID', 'INVALID_INPUT');
      }

      // Validate name
      if (!data.name || data.name.trim().length === 0) {
        return this.error('Project name is required', 'INVALID_INPUT');
      }

      if (data.name.length > 255) {
        return this.error('Project name must be 255 characters or less', 'INVALID_INPUT');
      }

      // Validate dates if provided
      if (data.startDate && data.endDate && data.startDate > data.endDate) {
        return this.error('Start date must be before end date', 'INVALID_INPUT');
      }

      // Check if organization exists
      const org = await this.db.query.organizations.findFirst({
        where: eq(organizations.id, data.organizationId)
      });

      if (!org) {
        return this.error('Organization not found', 'NOT_FOUND');
      }

      // Validate members if provided
      if (data.members && data.members.length > 0) {
        for (const member of data.members) {
          if (!this.validateUUID(member.userId)) {
            return this.error(`Invalid user ID: ${member.userId}`, 'INVALID_INPUT');
          }

          if (!this.validateProjectRoleCode(member.projectRoleCode)) {
            return this.error(`Invalid project role code: ${member.projectRoleCode}`, 'INVALID_INPUT');
          }

          // Check if user exists
          const user = await this.db.query.users.findFirst({
            where: eq(users.id, member.userId)
          });

          if (!user) {
            return this.error(`User not found: ${member.userId}`, 'NOT_FOUND');
          }
        }
      }

      // Create project
      const [project] = await this.db
        .insert(projects)
        .values({
          organizationId: data.organizationId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          statusCode: 1, // active
          createdBy: data.createdBy,
        })
        .returning({ id: projects.id });

      // Add members if provided
      if (data.members && data.members.length > 0) {
        await this.db.insert(projectMembers).values(
          data.members.map(member => ({
            projectId: project.id,
            userId: member.userId,
            projectRoleCode: member.projectRoleCode,
          }))
        );

        // Emit event for each assigned member
        for (const member of data.members) {
          await this.env.NOTIFICATIONS_QUEUE.send({
            typeCode: NotificationType.PROJECT_MEMBER_ASSIGNED.code,
            payload: {
              recipientUserId: member.userId,
              actorUserId: data.createdBy,
              projectId: project.id,
              roleCode: member.projectRoleCode,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      return this.success(project);
    } catch (error) {
      return this.handleError(error, 'Failed to create project');
    }
  }

  /**
   * Update project
   * Project Manager, Organization Manager, or System Admin
   */
  async updateProject(
    projectId: string,
    data: UpdateProjectData
  ): Promise<ServiceResponse<void>> {
    try {
      // Validate project ID
      if (!this.validateUUID(projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      // Check if project exists
      const project = await this.db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return this.error('Project not found', 'NOT_FOUND');
      }

      // Validate updates
      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
          return this.error('Project name cannot be empty', 'INVALID_INPUT');
        }

        if (data.name.length > 255) {
          return this.error('Project name must be 255 characters or less', 'INVALID_INPUT');
        }
      }

      if (data.statusCode !== undefined && !this.validateProjectStatusCode(data.statusCode)) {
        return this.error('Invalid status code', 'INVALID_INPUT');
      }

      // Validate dates if both are being updated
      const newStartDate = data.startDate !== undefined ? data.startDate : project.startDate;
      const newEndDate = data.endDate !== undefined ? data.endDate : project.endDate;
      
      if (newStartDate && newEndDate && newStartDate > newEndDate) {
        return this.error('Start date must be before end date', 'INVALID_INPUT');
      }

      // Build update object
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.statusCode !== undefined) updateData.statusCode = data.statusCode;
      updateData.updatedAt = new Date();

      // Update project
      await this.db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, projectId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to update project');
    }
  }

  /**
   * Delete project
   * Organization Manager or System Admin only
   */
  async deleteProject(projectId: string): Promise<ServiceResponse<void>> {
    try {
      // Validate project ID
      if (!this.validateUUID(projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      // Check if project exists
      const project = await this.db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return this.error('Project not found', 'NOT_FOUND');
      }

      // Delete project (cascade will delete project_members)
      await this.db.delete(projects).where(eq(projects.id, projectId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to delete project');
    }
  }

  /**
   * Add member to project
   * Project Manager, Organization Manager, or System Admin
   */
  async addMember(
    projectId: string,
    userId: string,
    projectRoleCode: number,
    currentUserId: string
  ): Promise<ServiceResponse<{ id: string }>> {
    try {
      // Validate IDs
      if (!this.validateUUID(projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      if (!this.validateUUID(userId)) {
        return this.error('Invalid user ID', 'INVALID_INPUT');
      }

      if (!this.validateProjectRoleCode(projectRoleCode)) {
        return this.error('Invalid project role code', 'INVALID_INPUT');
      }

      // Check if project exists
      const project = await this.db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return this.error('Project not found', 'NOT_FOUND');
      }

      // Check if user exists
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return this.error('User not found', 'NOT_FOUND');
      }

      // Check if user is already a member
      const existingMember = await this.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      });

      if (existingMember) {
        return this.error('User is already a member of this project', 'ALREADY_EXISTS');
      }

      // Add member
      const [member] = await this.db
        .insert(projectMembers)
        .values({
          projectId,
          userId,
          projectRoleCode,
        })
        .returning({ id: projectMembers.id });

      // Emit project member assigned event
      await this.env.NOTIFICATIONS_QUEUE.send({
        typeCode: NotificationType.PROJECT_MEMBER_ASSIGNED.code,
        payload: {
          recipientUserId: userId,
          actorUserId: currentUserId,
          projectId,
          roleCode: projectRoleCode,
          timestamp: new Date().toISOString(),
        },
      });

      return this.success(member);
    } catch (error) {
      return this.handleError(error, 'Failed to add project member');
    }
  }

  /**
   * Remove member from project
   * Project Manager, Organization Manager, or System Admin
   */
  async removeMember(
    projectId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Validate IDs
      if (!this.validateUUID(projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      if (!this.validateUUID(userId)) {
        return this.error('Invalid user ID', 'INVALID_INPUT');
      }

      // Check if member exists
      const member = await this.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      });

      if (!member) {
        return this.error('User is not a member of this project', 'NOT_FOUND');
      }

      // Remove member
      await this.db
        .delete(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userId)
          )
        );

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to remove project member');
    }
  }
}
