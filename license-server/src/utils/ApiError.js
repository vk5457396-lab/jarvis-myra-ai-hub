'use strict';

class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Client safe message
   * @param {object} [details] Extra JSON fields merged into the response
   */
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details || null;
    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found.') {
    return new ApiError(404, message);
  }

  static conflict(message, details) {
    return new ApiError(409, message, details);
  }

  static tooMany(message = 'Too many requests.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error.') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
