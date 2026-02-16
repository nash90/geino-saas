import { deleteCookie } from 'hono/cookie';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../../middleware/auth';
import { ErrorCodes } from '../../constants/errorCodes';
import type { OptionalAuthContext } from '../../types';

export async function logoutHandler(c: OptionalAuthContext) {
  try {
    const user = await authenticate(c);

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    await supabase.auth.signOut();

    deleteCookie(c, 'access_token');
    deleteCookie(c, 'refresh_token');

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Logout Error]', error);
    return c.json({ 
      error: 'Unauthorized',
      errorCode: ErrorCodes.UNAUTHORIZED
    }, 401);
  }
}
