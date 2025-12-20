import { pgTable, uuid, varchar, integer, timestamp, index, text, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({ length: 255 }).notNull(),
  systemRoleCode: integer('system_role_code'),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_system_role_code').on(table.systemRoleCode),
  // GIN trigram indexes for fast fuzzy search (requires pg_trgm extension)
  // CREATE EXTENSION IF NOT EXISTS pg_trgm;
  index('idx_users_firstname_trgm').using('gin', table.firstname.asc().op('gin_trgm_ops')),
  index('idx_users_lastname_trgm').using('gin', table.lastname.asc().op('gin_trgm_ops')),
  index('idx_users_email_trgm').using('gin', table.email.asc().op('gin_trgm_ops')),
]);

export const organizations = pgTable('organizations', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
});

export const organizationMembers = pgTable('organization_members', {
  id: uuid().primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationRoleCode: integer('organization_role_code').notNull(), // 1: organization_manager
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_org_members_org_id').on(table.organizationId),
  index('idx_org_members_user_id').on(table.userId),
  // Composite index for optimized organization manager permission checks
  // Used in JOIN queries: WHERE org_id = X AND user_id = Y AND role_code = 1
  index('idx_org_members_manager_lookup').on(table.organizationId, table.userId, table.organizationRoleCode),
  unique('unique_org_user').on(table.organizationId, table.userId),
]);

export const projects = pgTable('projects', {
  id: uuid().primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  statusCode: integer('status_code').default(1).notNull(), // 1: active, 2: completed, 3: archived
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_projects_org_id').on(table.organizationId),
  index('idx_projects_status_code').on(table.statusCode),
]);

export const projectMembers = pgTable('project_members', {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  projectRoleCode: integer('project_role_code').notNull(), // 1: project_manager, 2: geino_user, 3: genba_user
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_project_members_project_id').on(table.projectId),
  index('idx_project_members_user_id').on(table.userId),
  unique('unique_project_user').on(table.projectId, table.userId),
]);

export const tasks = pgTable('tasks', {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  title: varchar({ length: 500 }).notNull(),
  description: text(),
  statusCode: integer('status_code').notNull().default(1), // 1: hold, 2: todo, 3: in_progress, 4: done, 5: waiting
  typeCode: integer('type_code'),
  priorityCode: integer('priority_code'),
  assignedTo: uuid('assigned_to'),
  createdBy: uuid('created_by').notNull(),
  deadline: timestamp('deadline'),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_tasks_project_id').on(table.projectId),
  index('idx_tasks_status_code').on(table.statusCode),
  index('idx_tasks_assigned_to').on(table.assignedTo),
  index('idx_tasks_created_by').on(table.createdBy),
  index('idx_tasks_deadline').on(table.deadline),
]);

export const taskComments = pgTable('task_comments', {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text().notNull(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_task_comments_task_id').on(table.taskId),
  index('idx_task_comments_user_id').on(table.userId),
]);

export const attachments = pgTable('attachments', {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid('task_id'), // Nullable - if attached to task directly
  commentId: uuid('comment_id'), // Nullable - if attached to comment
  fileName: varchar('file_name', { length: 500 }).notNull(),
  fileUrl: text('file_url').notNull(), // Cloudflare R2 object key
  fileSize: integer('file_size'), // In bytes
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_attachments_task_id').on(table.taskId),
  index('idx_attachments_comment_id').on(table.commentId),
  index('idx_attachments_uploaded_by').on(table.uploadedBy),
]);

export const notifications = pgTable('notifications', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // Recipient
  typeCode: integer('type_code').notNull(), // Notification type code
  categoryCode: integer('category_code').notNull(), // 1=bell, 2=task_progress
  title: varchar({ length: 255 }).notNull(),
  message: text().notNull(),

  // Links to related entities
  taskId: uuid('task_id'),
  projectId: uuid('project_id'),
  organizationId: uuid('organization_id'),
  commentId: uuid('comment_id'),

  // Additional data as JSON
  metadata: text(), // JSON string for flexible data storage

  // State
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_created_at').on(table.createdAt),
  index('idx_notifications_category_code').on(table.categoryCode),
  index('idx_notifications_type_code').on(table.typeCode),
]);
