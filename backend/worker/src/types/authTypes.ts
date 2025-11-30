/**
 * Authentication domain types
 */

import type { User, UserWithRole } from './models';

/**
 * Re-export database models
 */
export type UserProfile = UserWithRole;

/**
 * Registration data interface
 */
export interface RegistrationData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

/**
 * Login data interface
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Token refresh response interface
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}
