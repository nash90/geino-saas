import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, organizations, organizationMembers } from '../db/schema';

/**
 * Database Models
 * 
 * Type-safe models inferred from Drizzle schema.
 * Use these types for query results and data manipulation.
 */

// ============================================================================
// User Models
// ============================================================================

/**
 * Full user model (SELECT)
 * Use for database query results
 */
export type User = InferSelectModel<typeof users>;

/**
 * New user model (INSERT)
 * Use for creating new users
 */
export type NewUser = InferInsertModel<typeof users>;

/**
 * User update model (UPDATE)
 * All fields optional except id
 */
export type UserUpdate = Partial<Omit<User, 'id'>> & { id: string };

// ============================================================================
// Serialized Models (API Responses)
// ============================================================================

/**
 * Basic user info (id + email only)
 */
export type UserBasic = Pick<User, 'id' | 'email'>;

/**
 * Public user profile (excludes system role)
 */
export type UserPublic = Omit<User, 'systemRoleCode'>;

/**
 * User with role info (for admin views)
 */
export type UserWithRole = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'systemRoleCode' | 'createdAt'>;

/**
 * User list item (for pagination)
 */
export type UserListItem = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'systemRoleCode' | 'createdAt'>;

// ============================================================================
// Organization Models
// ============================================================================

/**
 * Full organization model (SELECT)
 * Use for database query results
 */
export type Organization = InferSelectModel<typeof organizations>;

/**
 * New organization model (INSERT)
 * Use for creating new organizations
 */
export type NewOrganization = InferInsertModel<typeof organizations>;

/**
 * Organization update model (UPDATE)
 * All fields optional except id
 */
export type OrganizationUpdate = Partial<Omit<Organization, 'id'>> & { id: string };

/**
 * Organization list item (for pagination)
 */
export type OrganizationListItem = Pick<Organization, 'id' | 'name' | 'description' | 'createdAt'>;

// ============================================================================
// Organization Member Models
// ============================================================================

/**
 * Full organization member model (SELECT)
 * Use for database query results
 */
export type OrganizationMember = InferSelectModel<typeof organizationMembers>;

/**
 * New organization member model (INSERT)
 * Use for creating new organization members
 */
export type NewOrganizationMember = InferInsertModel<typeof organizationMembers>;

/**
 * Organization member with user details (for display)
 */
export type OrganizationMemberWithUser = OrganizationMember & {
  user: Pick<User, 'id' | 'email' | 'firstname' | 'lastname'>;
};

/**
 * Organization with members (for detail view)
 */
export type OrganizationWithMembers = Organization & {
  members: OrganizationMemberWithUser[];
};
