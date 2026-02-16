/**
 * Error Handler Utility
 * 
 * Centralized error handling for API calls with user-friendly messages.
 * Provides consistent error handling across the entire application.
 */

import { toast } from 'sonner';
import { 
  HTTP_ERROR_MESSAGES, 
  OPERATION_ERROR_MESSAGES, 
  PERMISSION_ERROR_MESSAGES 
} from '@/constants/errorMessages';
import { prodError } from '@/lib/logger';

/**
 * API Error structure from Axios
 */
interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
      errorCode?: string; // Backend error code (language-agnostic)
      message?: string;
    };
  };
  message?: string;
  code?: string;
  request?: any;
}

/**
 * All error code mappings combined
 */
const ERROR_CODE_MESSAGES = {
  ...OPERATION_ERROR_MESSAGES,
  ...PERMISSION_ERROR_MESSAGES,
} as const;

/**
 * Handle API errors and display user-friendly messages
 * 
 * Priority order for error messages:
 * 1. Backend error code mapping (response.data.errorCode) - Language-agnostic!
 * 2. Backend-provided error message (response.data.error) - For legacy/custom messages
 * 3. HTTP status code mapping
 * 4. Network error detection
 * 5. Timeout error detection
 * 6. Fallback message
 * 
 * @param error - Error object from API call (usually Axios error)
 * @param fallbackMessage - Default message if no specific error found
 * @param showToast - Whether to show toast notification (default: true)
 * @returns User-friendly error message in Japanese
 * 
 * @example
 * try {
 *   await tasksApi.create(data);
 * } catch (error) {
 *   handleApiError(error, OPERATION_ERROR_MESSAGES.TASK_CREATE_FAILED);
 * }
 */
export function handleApiError(
  error: unknown,
  fallbackMessage: string,
  showToast: boolean = true
): string {
  const apiError = error as ApiError;
  
  // Log error for debugging (always log in production for monitoring)
  prodError('API Error:', {
    status: apiError.response?.status,
    errorCode: apiError.response?.data?.errorCode,
    errorMessage: apiError.response?.data?.error,
    message: apiError.message,
    code: apiError.code,
    url: apiError.request?.responseURL,
  });
  
  let userMessage: string;
  
  // Priority 1: Check if backend sent an error code (language-agnostic)
  if (apiError.response?.data?.errorCode) {
    const errorCode = apiError.response.data.errorCode;
    userMessage = ERROR_CODE_MESSAGES[errorCode as keyof typeof ERROR_CODE_MESSAGES] || fallbackMessage;
  }
  // Priority 2: Check if backend sent a specific error message (legacy support)
  else if (apiError.response?.data?.error) {
    userMessage = apiError.response.data.error;
  }
  // Priority 3: Check for HTTP status code mapping
  else if (apiError.response?.status) {
    const statusCode = apiError.response.status;
    userMessage = HTTP_ERROR_MESSAGES[statusCode as keyof typeof HTTP_ERROR_MESSAGES] || fallbackMessage;
  }
  // Priority 4: Check for network errors
  else if (apiError.message === 'Network Error' || !apiError.response) {
    userMessage = HTTP_ERROR_MESSAGES.NETWORK_ERROR;
  }
  // Priority 5: Check for timeout
  else if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
    userMessage = HTTP_ERROR_MESSAGES.TIMEOUT;
  }
  // Priority 6: Fallback message
  else {
    userMessage = fallbackMessage;
  }
  
  // Show toast notification if requested
  if (showToast) {
    toast.error(userMessage);
  }
  
  return userMessage;
}

/**
 * Extract error message without showing toast
 * 
 * Useful when you want to get the error message for manual display
 * (e.g., in a form error state or custom error UI)
 * 
 * @param error - Error object from API call
 * @param fallbackMessage - Default message if no specific error found
 * @returns User-friendly error message in Japanese
 * 
 * @example
 * try {
 *   await authApi.login(credentials);
 * } catch (error) {
 *   const errorMsg = getErrorMessage(error, OPERATION_ERROR_MESSAGES.LOGIN_FAILED);
 *   setError(errorMsg); // Set in component state
 * }
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return handleApiError(error, fallbackMessage, false);
}

/**
 * Check if error is a specific HTTP status code
 * 
 * @param error - Error object from API call
 * @param statusCode - HTTP status code to check
 * @returns True if error matches the status code
 * 
 * @example
 * if (isErrorStatus(error, 403)) {
 *   // Handle permission error specifically
 * }
 */
export function isErrorStatus(error: unknown, statusCode: number): boolean {
  const apiError = error as ApiError;
  return apiError.response?.status === statusCode;
}

/**
 * Check if error is an authentication error (401)
 * 
 * @param error - Error object from API call
 * @returns True if error is 401 Unauthorized
 */
export function isAuthError(error: unknown): boolean {
  return isErrorStatus(error, 401);
}

/**
 * Check if error is a permission error (403)
 * 
 * @param error - Error object from API call
 * @returns True if error is 403 Forbidden
 */
export function isPermissionError(error: unknown): boolean {
  return isErrorStatus(error, 403);
}

/**
 * Check if error is a not found error (404)
 * 
 * @param error - Error object from API call
 * @returns True if error is 404 Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  return isErrorStatus(error, 404);
}

/**
 * Check if error is a network error
 * 
 * @param error - Error object from API call
 * @returns True if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const apiError = error as ApiError;
  return apiError.message === 'Network Error' || !apiError.response;
}
