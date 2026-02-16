import { PasswordService } from '../../services/auth/PasswordService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { BaseContext } from '../../types';

export async function updatePasswordHandler(c: BaseContext) {
  const { token, newPassword } = await c.req.json();
  
  const db = c.get('db');
  const passwordService = new PasswordService(db, c.env);
  
  // Call service layer
  const result = await passwordService.updatePassword(token, newPassword);

  if (!result.success) {
    return c.json({ 
      error: result.error,
      errorCode: ErrorCodes.PASSWORD_UPDATE_FAILED
    }, 400);
  }

  return c.json({
    success: true,
    message: 'パスワードが正常に更新されました',
  });
}
