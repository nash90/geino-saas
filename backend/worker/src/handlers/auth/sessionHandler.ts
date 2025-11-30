import { Context } from 'hono';
import { authenticate, type Env, type AuthUser } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function sessionHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>) {
  try {
    const user = await authenticate(c);
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        systemRoleCode: user.systemRoleCode,
      },
      organizations: [], // TODO: Fetch from organization_members
      projects: [], // TODO: Fetch from project_members
    });
  } catch (error) {
    console.error('[Session Error]', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
