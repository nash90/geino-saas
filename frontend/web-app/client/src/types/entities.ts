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

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  statusCode: number; // 1=hold, 2=todo, 3=in_progress, 4=done
  typeCode?: number; // 1=type_a, 2=type_b
  priorityCode?: number; // 1=low, 2=medium, 3=high, 4=urgent
  assignedTo?: string;
  createdBy: string;
  deadline?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithDetails extends Task {
  assignee?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  creator?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  taskId?: string;
  commentId?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AttachmentWithUploader extends Attachment {
  uploader: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  attachments?: Attachment[];
}

export interface TaskCommentWithUser extends TaskComment {
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

export interface TaskWithComments extends Task {
  comments: TaskComment[];
  assignee?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  creator?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  attachments?: Attachment[];
}

// Code type interfaces
export interface CodeType {
  code: number;
  label: string;
  key: string;
}

export const TaskStatus: Record<string, CodeType> = {
  HOLD: { code: 1, label: '保留', key: 'hold' },
  TODO: { code: 2, label: '未着手', key: 'todo' },
  IN_PROGRESS: { code: 3, label: '進行中', key: 'in_progress' },
  DONE: { code: 4, label: '完了', key: 'done' }
};

export const TaskPriority: Record<string, CodeType> = {
  LOW: { code: 1, label: 'Low', key: 'low' },
  MEDIUM: { code: 2, label: 'Medium', key: 'medium' },
  HIGH: { code: 3, label: 'High', key: 'high' },
  URGENT: { code: 4, label: 'Urgent', key: 'urgent' }
};

export const TaskType: Record<string, CodeType> = {
  TYPE_A: { code: 1, label: 'タスク種別A', key: 'type_a' },
  TYPE_B: { code: 2, label: 'タスク種別B', key: 'type_b' }
};

export const ProjectStatus: Record<string, CodeType> = {
  ACTIVE: { code: 1, label: '進行中', key: 'active' },
  COMPLETED: { code: 2, label: '完了', key: 'completed' },
  ARCHIVED: { code: 3, label: 'アーカイブ', key: 'archived' }
};

// Role code constants
export const SystemRole = {
  SYSTEM_ADMIN: { code: 1, label: 'System Admin', key: 'system_admin' },
  REGULAR_USER: { code: 2, label: 'Regular User', key: 'regular_user' }
} as const;

export const OrganizationRole = {
  ORGANIZATION_MANAGER: { code: 1, label: 'Organization Manager', key: 'organization_manager' },
  ORGANIZATION_MEMBER: { code: 2, label: 'Organization Member', key: 'organization_member' }
} as const;

export const ProjectRole = {
  PROJECT_MANAGER: { code: 1, label: 'Project Manager', key: 'project_manager' },
  GEINO_USER: { code: 2, label: 'Geino User', key: 'geino_user' },
  GENBA_USER: { code: 3, label: 'Genba User', key: 'genba_user' }
} as const;

// Notification Category Codes
export const NotificationCategory = {
  BELL: { code: 1, label: 'Bell Notification', key: 'bell' },
  TASK_PROGRESS: { code: 2, label: 'Task Progress', key: 'task_progress' }
} as const;

// Notification Type Codes
export const NotificationType = {
  // Bell notifications (category_code = 1)
  USER_MENTIONED: { code: 1, label: 'Mentioned in Comment', key: 'user_mentioned', categoryCode: 1 },
  PROJECT_MEMBER_ASSIGNED: { code: 2, label: 'Project Member Assigned', key: 'project_member_assigned', categoryCode: 1 },
  ORGANIZATION_MANAGER_ASSIGNED: { code: 3, label: 'Org Manager Assigned', key: 'organization_manager_assigned', categoryCode: 1 },
  PROJECT_MANAGER_ASSIGNED: { code: 4, label: 'Project Manager Assigned', key: 'project_manager_assigned', categoryCode: 1 },

  // Task progress notifications (category_code = 2)
  TASK_ASSIGNED: { code: 11, label: 'Task Assigned', key: 'task_assigned', categoryCode: 2 },
  TASK_STATUS_CHANGED: { code: 12, label: 'Task Status Changed', key: 'task_status_changed', categoryCode: 2 },
  TASK_UPDATED: { code: 13, label: 'Task Details Updated', key: 'task_updated', categoryCode: 2 }
} as const;
