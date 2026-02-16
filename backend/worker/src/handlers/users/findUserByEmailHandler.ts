import { UserQueryService } from '../../services/users/UserQueryService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

/**
 * Find user by exact email match
 * Accessible to all authenticated users for secure member assignment
 * Requires exact email to prevent data leakage
 */
export async function findUserByEmailHandler(c: AuthContext) {
  const db = c.get('db');
  const userQueryService = new UserQueryService(db, c.env);

  const email = c.req.query('email');

  if (!email) {
    return c.json({ 
      error: 'Email parameter is required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  const result = await userQueryService.findUserByEmail(email);

  if (!result.success) {
    return c.json({ 
      error: result.error,
      errorCode: ErrorCodes.USER_SEARCH_FAILED
    }, 400);
  }

  // Return user or null if not found
  return c.json({ user: result.data });
}
