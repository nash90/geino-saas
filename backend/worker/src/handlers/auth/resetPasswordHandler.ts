import { PasswordService } from '../../services/auth/PasswordService';
import type { BaseContext } from '../../types';

export async function resetPasswordHandler(c: BaseContext) {
  const { email } = await c.req.json();
  
  const db = c.get('db');
  const passwordService = new PasswordService(db, c.env);
  
  // Get APP_URL from environment or use default
  const appUrl = c.env.APP_URL || 'http://localhost:3000';
  
  // Call service layer
  const result = await passwordService.resetPassword(email, appUrl);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ 
    message: 'If an account exists with that email, you will receive a password reset link.' 
  });
}
