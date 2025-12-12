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
