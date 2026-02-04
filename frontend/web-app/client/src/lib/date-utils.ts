/**
 * Date utility functions for consistent date/time handling across the application
 */

/**
 * Converts a UTC ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
 * Used for datetime-local input fields
 * 
 * @param utcIsoString - UTC ISO string (e.g., "2026-03-10T09:00:00.000Z")
 * @returns Local datetime string (e.g., "2026-03-10T18:00")
 */
export function toLocalDateTimeString(utcIsoString: string): string {
  const date = new Date(utcIsoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a date/time string for display with date and time
 * Uses browser's locale for automatic formatting
 * 
 * @param dateString - ISO date string or Date object
 * @returns Formatted string (e.g., "2026/3/10 18:00" for ja, "3/10/2026, 6:00 PM" for en-US)
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Formats a date string for display (date only, no time)
 * Uses browser's locale for automatic formatting
 * 
 * @param dateString - ISO date string or Date object
 * @returns Formatted string (e.g., "2026/3/10" for ja, "3/10/2026" for en-US)
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
}

/**
 * Formats a time string for display (time only, no date)
 * Uses browser's locale for automatic formatting
 * 
 * @param dateString - ISO date string or Date object
 * @returns Formatted string (e.g., "18:00" for ja, "6:00 PM" for en-US)
 */
export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}
