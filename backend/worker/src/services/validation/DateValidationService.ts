/**
 * Date Validation Service
 * 
 * Centralized date/datetime validation for backend operations.
 * Handles ISO 8601 date strings, future date validation, and date range checks.
 */

// Simple error response for validation
interface ValidationError {
  error: string;
  code: string;
}

export class DateValidationService {
  /**
   * Create error response helper
   */
  private error(message: string, code: string): ValidationError {
    return { error: message, code };
  }

  /**
   * Validates an ISO 8601 date string format and ensures it's a valid date
   * 
   * @param isoString - ISO 8601 date string (e.g., "2026-03-10T09:00:00.000Z")
   * @param fieldName - Name of the field for error messages (e.g., "deadline")
   * @returns ValidationError if invalid, null if valid
   */
  validateISODateString(
    isoString: string | undefined,
    fieldName: string = 'date'
  ): ValidationError | null {
    // Undefined/null is valid (optional field)
    if (!isoString) {
      return null;
    }

    // Check if string is empty
    if (isoString.trim() === '') {
      return null; // Empty is valid (optional)
    }

    // Try to parse the date
    const date = new Date(isoString);

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return this.error(
        `Invalid ${fieldName} format. Expected ISO 8601 format.`,
        'INVALID_DATE_FORMAT'
      );
    }

    // Additional check: Ensure the date is reasonable (not too far in past or future)
    // This prevents issues with invalid dates that still parse
    const minYear = 1900;
    const maxYear = 2100;
    const year = date.getFullYear();

    if (year < minYear || year > maxYear) {
      return this.error(
        `${fieldName} year must be between ${minYear} and ${maxYear}`,
        'INVALID_DATE_RANGE'
      );
    }

    return null; // Valid
  }

  /**
   * Validates that a date is in the future
   * Commonly used for deadline validation
   * 
   * @param date - Date object or ISO string to validate
   * @param fieldName - Name of the field for error messages
   * @param allowEqual - Whether to allow the exact current time (default: false)
   * @returns ValidationError if not in future, null if valid
   */
  validateFutureDate(
    date: Date | string | undefined,
    fieldName: string = 'date',
    allowEqual: boolean = false
  ): ValidationError | null {
    // Undefined/null is valid (optional field)
    if (!date) {
      return null;
    }

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return this.error(
        `Invalid ${fieldName} format`,
        'INVALID_DATE_FORMAT'
      );
    }

    const now = new Date();

    // Compare timestamps
    if (allowEqual) {
      if (dateObj.getTime() < now.getTime()) {
        return this.error(
          `${fieldName} must be in the future or present`,
          'DATE_MUST_BE_FUTURE'
        );
      }
    } else {
      if (dateObj.getTime() <= now.getTime()) {
        return this.error(
          `${fieldName} must be in the future`,
          'DATE_MUST_BE_FUTURE'
        );
      }
    }

    return null; // Valid
  }

  /**
   * Validates that a date is within a specific range
   * 
   * @param date - Date to validate
   * @param minDate - Minimum allowed date (inclusive)
   * @param maxDate - Maximum allowed date (inclusive)
   * @param fieldName - Name of the field for error messages
   * @returns ValidationError if out of range, null if valid
   */
  validateDateRange(
    date: Date | string | undefined,
    minDate: Date | undefined,
    maxDate: Date | undefined,
    fieldName: string = 'date'
  ): ValidationError | null {
    // Undefined/null is valid (optional field)
    if (!date) {
      return null;
    }

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return this.error(
        `Invalid ${fieldName} format`,
        'INVALID_DATE_FORMAT'
      );
    }

    // Check minimum date
    if (minDate && dateObj.getTime() < minDate.getTime()) {
      return this.error(
        `${fieldName} must be on or after ${minDate.toISOString()}`,
        'DATE_TOO_EARLY'
      );
    }

    // Check maximum date
    if (maxDate && dateObj.getTime() > maxDate.getTime()) {
      return this.error(
        `${fieldName} must be on or before ${maxDate.toISOString()}`,
        'DATE_TOO_LATE'
      );
    }

    return null; // Valid
  }

  /**
   * Validates that a date is not too far in the future
   * Useful for preventing unrealistic deadlines
   * 
   * @param date - Date to validate
   * @param maxYearsInFuture - Maximum years in the future allowed
   * @param fieldName - Name of the field for error messages
   * @returns ValidationError if too far in future, null if valid
   */
  validateReasonableFuture(
    date: Date | string | undefined,
    maxYearsInFuture: number = 10,
    fieldName: string = 'date'
  ): ValidationError | null {
    // Undefined/null is valid (optional field)
    if (!date) {
      return null;
    }

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return this.error(
        `Invalid ${fieldName} format`,
        'INVALID_DATE_FORMAT'
      );
    }

    // Calculate max date
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + maxYearsInFuture);

    if (dateObj.getTime() > maxDate.getTime()) {
      return this.error(
        `${fieldName} cannot be more than ${maxYearsInFuture} years in the future`,
        'DATE_TOO_FAR_FUTURE'
      );
    }

    return null; // Valid
  }

  /**
   * Validates a deadline with common business rules:
   * - Must be valid ISO format
   * - Must be in the future
   * - Must be within reasonable range (not too far in future)
   * 
   * @param deadline - Deadline to validate
   * @param maxYearsInFuture - Maximum years in the future allowed (default: 10)
   * @returns ValidationError if invalid, null if valid
   */
  validateDeadline(
    deadline: Date | string | undefined,
    maxYearsInFuture: number = 10
  ): ValidationError | null {
    // Undefined/null is valid (deadline is optional)
    if (!deadline) {
      return null;
    }

    // Convert to string for ISO validation if it's a Date
    const isoString = deadline instanceof Date ? deadline.toISOString() : deadline;

    // Validate ISO format
    const isoError = this.validateISODateString(isoString, 'Deadline');
    if (isoError) return isoError;

    // Validate future date
    const futureError = this.validateFutureDate(deadline, 'Deadline', false);
    if (futureError) return futureError;

    // Validate reasonable future
    const reasonableError = this.validateReasonableFuture(
      deadline,
      maxYearsInFuture,
      'Deadline'
    );
    if (reasonableError) return reasonableError;

    return null; // All validations passed
  }

  /**
   * Validates that date1 is before date2
   * 
   * @param date1 - First date
   * @param date2 - Second date
   * @param date1Name - Name of first date for error messages
   * @param date2Name - Name of second date for error messages
   * @returns ValidationError if date1 is not before date2, null if valid
   */
  validateDateOrder(
    date1: Date | string | undefined,
    date2: Date | string | undefined,
    date1Name: string = 'start date',
    date2Name: string = 'end date'
  ): ValidationError | null {
    // If either is undefined, skip validation
    if (!date1 || !date2) {
      return null;
    }

    // Convert to Date objects
    const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;

    // Check if dates are invalid
    if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) {
      return this.error(
        'Invalid date format for date comparison',
        'INVALID_DATE_FORMAT'
      );
    }

    // Check order
    if (dateObj1.getTime() >= dateObj2.getTime()) {
      return this.error(
        `${date1Name} must be before ${date2Name}`,
        'INVALID_DATE_ORDER'
      );
    }

    return null; // Valid
  }
}
