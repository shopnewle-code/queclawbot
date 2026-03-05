import { logger } from "../utils/logger.js";

/**
 * Error Handling Middleware
 */

export function errorHandler(err, req, res, next) {
  logger.error(`Request error: ${req.method} ${req.path}`, err);

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * 404 Handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
}

/**
 * Request Logger Middleware
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusClass =
      res.statusCode < 400 ? "✅" : res.statusCode < 500 ? "⚠️" : "❌";

    logger.debug(
      `${statusClass} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

/**
 * Validation Middleware
 */
export function validateJSON(req, res, next) {
  if (
    req.is("json") &&
    typeof req.body === "string"
  ) {
    try {
      req.body = JSON.parse(req.body);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid JSON",
      });
    }
  }

  next();
}

export default {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateJSON,
};
