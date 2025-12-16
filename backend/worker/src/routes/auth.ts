import { Hono } from 'hono';
import type { BaseEnv } from '../types';
import { registerHandler } from '../handlers/auth/registerHandler';
import { loginHandler } from '../handlers/auth/loginHandler';
import { logoutHandler } from '../handlers/auth/logoutHandler';
import { refreshHandler } from '../handlers/auth/refreshHandler';
import { sessionHandler } from '../handlers/auth/sessionHandler';
import { resetPasswordHandler } from '../handlers/auth/resetPasswordHandler';
import { updatePasswordHandler } from '../handlers/auth/updatePasswordHandler';

const auth = new Hono<BaseEnv>();

auth.post('/register', registerHandler);
auth.post('/login', loginHandler);
auth.post('/logout', logoutHandler);
auth.post('/refresh', refreshHandler);
auth.get('/session', sessionHandler);
auth.post('/reset-password', resetPasswordHandler);
auth.post('/update-password', updatePasswordHandler);

export default auth;
