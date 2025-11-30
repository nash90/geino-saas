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
