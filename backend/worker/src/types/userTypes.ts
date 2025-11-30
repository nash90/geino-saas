/**
 * User Domain Types
 */

/**
 * User update profile data
 */
export interface UserProfileUpdateData {
  firstname?: string;
  lastname?: string;
}

/**
 * User role update data
 */
export interface UserRoleUpdateData {
  systemRoleCode: number | null;
}
