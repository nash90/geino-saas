/**
 * Date/DateTime Validation Utilities
 * 
 * Handles validation for datetime-local inputs and date values.
 * Uses HTMLInputElement.validity API to distinguish between:
 * - Empty input (optional field, no value entered)
 * - Invalid input (user entered malformed date)
 */

export interface DateTimeValidationResult {
  valid: boolean;
  error?: string;
  isEmpty?: boolean;
}

/**
 * Validates a datetime-local input element using HTML5 validity API
 * This can distinguish between empty input vs invalid input
 * 
 * @param inputElement - The datetime-local input element to validate
 * @param required - Whether the field is required
 * @returns Validation result with detailed error messages
 * 
 * @example
 * const input = document.getElementById('deadline') as HTMLInputElement;
 * const result = validateDateTimeInput(input, false);
 * if (!result.valid && !result.isEmpty) {
 *   toast.error(result.error);
 * }
 */
export function validateDateTimeInput(
  inputElement: HTMLInputElement,
  required: boolean = false
): DateTimeValidationResult {
  const value = inputElement.value;
  const validity = inputElement.validity;

  // IMPORTANT: Check for bad input FIRST before checking empty value
  // For datetime-local inputs, invalid input results in value="" AND badInput=true
  // We need to catch badInput before the empty check
  if (validity.badInput) {
    return {
      valid: false,
      isEmpty: false,
      error: '無効な日付形式です'
    };
  }

  // Check if empty (only reaches here if badInput is false)
  if (!value || value.trim() === '') {
    if (required) {
      return {
        valid: false,
        isEmpty: true,
        error: '期限を入力してください'
      };
    }
    // Empty but not required - this is valid
    return { valid: true, isEmpty: true };
  }

  // Check for type mismatch (shouldn't happen with datetime-local, but good to check)
  if (validity.typeMismatch) {
    return {
      valid: false,
      isEmpty: false,
      error: '日付形式が正しくありません'
    };
  }

  // Check if value is outside min/max range (if specified on input)
  if (validity.rangeUnderflow) {
    return {
      valid: false,
      isEmpty: false,
      error: '指定された最小日時より前の日付は選択できません'
    };
  }

  if (validity.rangeOverflow) {
    return {
      valid: false,
      isEmpty: false,
      error: '指定された最大日時より後の日付は選択できません'
    };
  }

  // Check if step is violated (e.g., minutes must be in increments)
  if (validity.stepMismatch) {
    return {
      valid: false,
      isEmpty: false,
      error: '指定された時間間隔に合わせてください'
    };
  }

  // Additional check: Try to parse as Date to ensure it's actually valid
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      isEmpty: false,
      error: '無効な日付です'
    };
  }

  return { valid: true, isEmpty: false };
}

/**
 * Validates a datetime-local string value (from state, not input element)
 * Use this when you only have the string value, not access to the input element
 * 
 * @param value - The datetime-local string (YYYY-MM-DDTHH:mm format)
 * @param required - Whether the field is required
 * @returns Validation result with detailed error messages
 */
export function validateDateTimeValue(
  value: string,
  required: boolean = false
): DateTimeValidationResult {
  // Check if empty
  if (!value || value.trim() === '') {
    if (required) {
      return {
        valid: false,
        isEmpty: true,
        error: '期限を入力してください'
      };
    }
    return { valid: true, isEmpty: true };
  }

  // Check format (datetime-local should be YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss)
  const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
  if (!datetimeLocalRegex.test(value)) {
    return {
      valid: false,
      isEmpty: false,
      error: '日付形式が正しくありません (YYYY-MM-DDTHH:mm)'
    };
  }

  // Try to parse as Date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      isEmpty: false,
      error: '無効な日付です'
    };
  }

  return { valid: true, isEmpty: false };
}

/**
 * Validates a deadline date with business logic rules
 * - Must be a valid date
 * - Must be in the future
 * - Must be within reasonable range (not too far in future)
 * 
 * @param value - The datetime-local string or Date object
 * @param allowPast - Whether to allow past dates (default: false for deadlines)
 * @param maxYearsInFuture - Maximum years in the future allowed (default: 10)
 * @returns Validation result
 */
export function validateDeadlineValue(
  value: string | Date | undefined,
  allowPast: boolean = false,
  maxYearsInFuture: number = 10
): DateTimeValidationResult {
  // Empty is valid (deadline is optional)
  if (!value) {
    return { valid: true, isEmpty: true };
  }

  // Convert to Date if string
  const date = typeof value === 'string' ? new Date(value) : value;

  // Check if valid date
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      isEmpty: false,
      error: '無効な日付です'
    };
  }

  const now = new Date();
  
  // Check if in the past (for deadline validation)
  if (!allowPast && date < now) {
    return {
      valid: false,
      isEmpty: false,
      error: '期限は現在時刻より後に設定してください'
    };
  }

  // Check if too far in the future
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + maxYearsInFuture);
  
  if (date > maxDate) {
    return {
      valid: false,
      isEmpty: false,
      error: `期限は${maxYearsInFuture}年以内に設定してください`
    };
  }

  return { valid: true, isEmpty: false };
}

/**
 * Validates an ISO 8601 date string (for API responses/requests)
 * 
 * @param isoString - ISO 8601 date string (e.g., "2026-03-10T09:00:00.000Z")
 * @returns Validation result
 */
export function validateISODateString(isoString: string | undefined): DateTimeValidationResult {
  if (!isoString) {
    return { valid: true, isEmpty: true };
  }

  // Try to parse
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      isEmpty: false,
      error: '無効なISO日付形式です'
    };
  }

  return { valid: true, isEmpty: false };
}

/**
 * Helper to get user-friendly error message or undefined if valid
 * Useful for directly using in toast notifications
 * 
 * @param validationResult - Result from any validation function
 * @returns Error message string or undefined if valid
 */
export function getValidationError(validationResult: DateTimeValidationResult): string | undefined {
  return validationResult.valid ? undefined : validationResult.error;
}
