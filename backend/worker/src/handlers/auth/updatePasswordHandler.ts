import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function updatePasswordHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient } }>) {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ error: 'トークンと新しいパスワードが必要です' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'パスワードは8文字以上である必要があります' }, 400);
    }

    // Create Supabase client with service_role key for admin operations
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin API
    );

    // Verify the recovery token and get user info
    const { data: userData, error: verifyError } = await supabase.auth.getUser(token);

    if (verifyError || !userData?.user) {
      console.error('[Update Password - Token Verification Error]', {
        message: verifyError?.message,
        status: verifyError?.status,
      });
      return c.json({ error: 'トークンが無効または期限切れです' }, 400);
    }

    // Update password using Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('[Update Password - Update Error]', {
        message: error.message,
        status: error.status,
        code: error.code,
        userId: userData.user.id,
      });
      return c.json({ error: error.message || 'パスワードの更新に失敗しました' }, 400);
    }

    console.log('[Update Password - Success]', {
      userId: data.user?.id,
      email: data.user?.email,
    });

    return c.json({
      success: true,
      message: 'パスワードが正常に更新されました',
    });
  } catch (error: any) {
    console.error('[Update Password - Internal Error]', {
      message: error?.message,
      stack: error?.stack,
    });
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
}
