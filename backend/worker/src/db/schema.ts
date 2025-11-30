import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
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
