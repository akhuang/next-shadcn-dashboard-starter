/**
 * Logger utility for development and production environments
 *
 * In production, logs are suppressed unless explicitly enabled
 * In development, all logs are shown
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    // Errors are always logged
    // eslint-disable-next-line no-console
    console.error(...args);
  },

  warn: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  }
};

export default logger;
