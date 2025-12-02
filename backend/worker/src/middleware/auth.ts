import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { OptionalAuthContext, AuthContext, AuthUser } from '../types';

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function authenticate(c: OptionalAuthContext): Promise<AuthUser> {
  const cookieHeader = c.req.header('Cookie');
  const token = getCookieValue(cookieHeader || null, 'access_token');
  
  if (!token) {
    throw new Error('Unauthorized: No access token provided');
  }

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  const db = c.get('db');
  const appUser = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });

  if (!appUser) {
    throw new Error('User profile not found');
  }

  const authUser: AuthUser = {
    id: appUser.id,
    email: appUser.email,
    firstname: appUser.firstname,
    lastname: appUser.lastname,
    systemRoleCode: appUser.systemRoleCode,
  };

  c.set('user', authUser);
  return authUser;
}

export function requireSystemAdmin() {
  return async (c: OptionalAuthContext, next: () => Promise<void>) => {
    const user = c.get('user');
    
    if (!user || user.systemRoleCode !== 1) {
      return c.json({ error: 'Forbidden: System Admin access required' }, 403);
    }
    
    await next();
  };
}

/**
 * Check if user is Organization Manager or above (System Admin or Org Manager of the organization)
 * Used for operations that require organization-level permissions
 */
export async function isOrganizationManagerOrAbove(
  c: OptionalAuthContext,
  organizationId: string
): Promise<boolean>;
export async function isOrganizationManagerOrAbove(
  c: AuthContext,
  organizationId: string
): Promise<boolean>;
export async function isOrganizationManagerOrAbove(
  c: any,
  organizationId: string
): Promise<boolean> {
  const user = c.get('user');
  if (!user) return false;

  // System Admin has access to everything
  if (user.systemRoleCode === 1) return true;

  // Check if user is Organization Manager of this organization
  const db = c.get('db');
  const { organizationMembers } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, user.id),
      eq(organizationMembers.organizationRoleCode, 1) // 1 = organization_manager
    )
  });

  return !!member;
}

/**
 * Check if user is Project Manager or above for a specific project
 * Includes: System Admin, Organization Manager of the org, or Project Manager of the project
 */
export async function isProjectManagerOrAbove(
  c: OptionalAuthContext,
  projectId: string
): Promise<boolean>;
export async function isProjectManagerOrAbove(
  c: AuthContext,
  projectId: string
): Promise<boolean>;
export async function isProjectManagerOrAbove(
  c: any,
  projectId: string
): Promise<boolean> {
  const user = c.get('user');
  if (!user) return false;

  // System Admin has access to everything
  if (user.systemRoleCode === 1) return true;

  const db = c.get('db');
  const { projects, projectMembers, organizationMembers } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

  // Get project to find its organization
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId)
  });

  if (!project) return false;

  // Check if user is Organization Manager of the project's organization
  const orgMember = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, project.organizationId),
      eq(organizationMembers.userId, user.id),
      eq(organizationMembers.organizationRoleCode, 1) // 1 = organization_manager
    )
  });

  if (orgMember) return true;

  // Check if user is Project Manager of this project
  const projectMember = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, user.id),
      eq(projectMembers.projectRoleCode, 1) // 1 = project_manager
    )
  });

  return !!projectMember;
}
