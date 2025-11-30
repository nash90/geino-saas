import { RegistrationService } from '../../services/auth/RegistrationService';
import type { BaseContext } from '../../types';

export async function registerHandler(c: BaseContext) {
  const { email, password, firstname, lastname } = await c.req.json();
  
  const db = c.get('db');
  const registrationService = new RegistrationService(db, c.env);
  
  // Call service layer
  const result = await registrationService.register({
    email,
    password,
    firstname,
    lastname,
  });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ 
    message: 'Registration successful! Please check your email to verify your account.' 
  });
}
