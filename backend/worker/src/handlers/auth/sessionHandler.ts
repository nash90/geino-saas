import { authenticate } from '../../middleware/auth';
import { LoginService } from '../../services/auth/LoginService';
import type { OptionalAuthContext } from '../../types';

export async function sessionHandler(c: OptionalAuthContext) {
  try {
    const user = await authenticate(c);
    const db = c.get('db');
    const loginService = new LoginService(db, c.env);
    
    // Fetch user's organizations and projects
    const { organizations, projects } = await loginService.getUserMemberships(user.id);
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        systemRoleCode: user.systemRoleCode,
      },
      organizations,
      projects,
    });
  } catch (error) {
    console.error('[Session Error]', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
