/**
 * Development-only logging utility
 * 
 * Logs only in development mode to keep production console clean.
 * Use this instead of direct console.* calls for debugging purposes.
 */

const isDev = import.meta.env.DEV;

/**
 * Log general information (dev only)
 */
export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

/**
 * Log warnings (dev only)
 */
export const devWarn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * Log errors (dev only)
 */
export const devError = (...args: any[]) => {
  if (isDev) {
    console.error(...args);
  }
};

/**
 * Log errors in both dev and production
 * Use sparingly, only for critical errors that need monitoring
 */
export const prodError = (...args: any[]) => {
  console.error(...args);
};

/**
 * Log warnings in both dev and production
 * Use for non-critical issues that should be monitored
 */
export const prodWarn = (...args: any[]) => {
  console.warn(...args);
};
