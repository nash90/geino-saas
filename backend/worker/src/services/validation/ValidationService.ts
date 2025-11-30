/**
 * Validation service for input validation across the application
 * 
 * Responsibilities:
 * - Email format validation
 * - Password strength validation
 * - Required fields validation
 * - Data format validation
 */
export class ValidationService {
  /**
   * Validate email format
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    // Check for at least one uppercase, one lowercase, one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return { 
        valid: false, 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(data: Record<string, any>, fields: string[]): { valid: boolean; error?: string; missing?: string[] } {
    const missing = fields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(', ')}`,
        missing,
      };
    }

    return { valid: true };
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(data: {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
  }): { valid: boolean; error?: string } {
    // Check required fields
    const fieldsCheck = this.validateRequiredFields(data, ['email', 'password', 'firstname', 'lastname']);
    if (!fieldsCheck.valid) {
      return fieldsCheck;
    }

    // Validate email
    const emailCheck = this.validateEmail(data.email);
    if (!emailCheck.valid) {
      return emailCheck;
    }

    // Validate password
    const passwordCheck = this.validatePassword(data.password);
    if (!passwordCheck.valid) {
      return passwordCheck;
    }

    // Validate name fields
    if (data.firstname.trim().length < 1) {
      return { valid: false, error: 'First name must not be empty' };
    }

    if (data.lastname.trim().length < 1) {
      return { valid: false, error: 'Last name must not be empty' };
    }

    return { valid: true };
  }

  /**
   * Validate login data
   */
  validateLoginData(data: {
    email: string;
    password: string;
  }): { valid: boolean; error?: string } {
    // Check required fields
    const fieldsCheck = this.validateRequiredFields(data, ['email', 'password']);
    if (!fieldsCheck.valid) {
      return fieldsCheck;
    }

    // Validate email
    const emailCheck = this.validateEmail(data.email);
    if (!emailCheck.valid) {
      return emailCheck;
    }

    return { valid: true };
  }

  /**
   * Validate password reset data
   */
  validatePasswordResetData(data: {
    email: string;
  }): { valid: boolean; error?: string } {
    return this.validateEmail(data.email);
  }

  /**
   * Validate password update data
   */
  validatePasswordUpdateData(data: {
    token: string;
    password: string;
  }): { valid: boolean; error?: string } {
    // Check required fields
    const fieldsCheck = this.validateRequiredFields(data, ['token', 'password']);
    if (!fieldsCheck.valid) {
      return fieldsCheck;
    }

    // Validate password
    const passwordCheck = this.validatePassword(data.password);
    if (!passwordCheck.valid) {
      return passwordCheck;
    }

    return { valid: true };
  }

  /**
   * Validate user ID format
   */
  validateUserId(id: string): { valid: boolean; error?: string } {
    if (!id) {
      return { valid: false, error: 'User ID is required' };
    }

    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return { valid: false, error: 'Invalid user ID format' };
    }

    return { valid: true };
  }

  /**
   * Validate system role code
   */
  validateSystemRoleCode(code: number | null): { valid: boolean; error?: string } {
    if (code === null) {
      return { valid: true }; // null is valid (regular user)
    }

    if (code !== 1) {
      return { valid: false, error: 'Invalid system role code. Must be 1 (system admin) or null' };
    }

    return { valid: true };
  }
}
