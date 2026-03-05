/**
 * Logger Utility
 * Simple consistent logging across the application
 */

const LOG_LEVELS = {
  ERROR: "🔴",
  WARN: "🟡",
  INFO: "🔵",
  SUCCESS: "✅",
  DEBUG: "🟣",
};

export function logError(message, error = null) {
  console.error(`${LOG_LEVELS.ERROR} ERROR:`, message);
  if (error) console.error(error);
}

export function logWarn(message) {
  console.warn(`${LOG_LEVELS.WARN} WARN:`, message);
}

export function logInfo(message) {
  console.log(`${LOG_LEVELS.INFO} INFO:`, message);
}

export function logSuccess(message) {
  console.log(`${LOG_LEVELS.SUCCESS} SUCCESS:`, message);
}

export function logDebug(message, data = null) {
  if (process.env.DEBUG) {
    console.log(`${LOG_LEVELS.DEBUG} DEBUG:`, message);
    if (data) console.log(data);
  }
}

export const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  success: logSuccess,
  debug: logDebug,
};

export default logger;
