import { setCookie } from 'hono/cookie';
import { LoginService } from '../../services/auth/LoginService';
import type { BaseContext } from '../../types';

export async function loginHandler(c: BaseContext) {
  const { email, password } = await c.req.json();
  
  const db = c.get('db');
  const loginService = new LoginService(db, c.env);
  
  // Call service layer
  const result = await loginService.login({ email, password });

  if (!result.success) {
    const statusCode = result.code === 'INVALID_CREDENTIALS' ? 401 : 400;
    return c.json({ error: result.error }, statusCode);
  }

  const { user, accessToken, refreshToken } = result.data!;

  // Set httpOnly cookies
  setCookie(c, 'access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 3600, // 1 hour
    path: '/',
  });

  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 2592000, // 30 days
    path: '/',
  });

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
}
