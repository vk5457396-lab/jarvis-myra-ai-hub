/**
 * Uniform JSON responses. Every endpoint in this backend uses these helpers so
 * the Android client never receives HTML.
 */

export function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
  return res;
}

export function success(res, data = {}, message = 'OK', statusCode = 200) {
  return json(res, statusCode, { success: true, message, data });
}

export function failure(res, statusCode, message, errorCode, extra = {}) {
  return json(res, statusCode, {
    success: false,
    message,
    error_code: errorCode,
    ...extra,
  });
}

export class ApiError extends Error {
  constructor(statusCode, message, errorCode, extra) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.extra = extra || {};
  }

  static badRequest(message, errorCode = 'BAD_REQUEST', extra) {
    return new ApiError(400, message, errorCode, extra);
  }
  static unauthorized(message = 'Unauthorized.', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }
  static forbidden(message = 'Forbidden.', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }
  static notFound(message = 'Not found.', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }
  static conflict(message, errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }
  static tooMany(message = 'Too many requests.', errorCode = 'RATE_LIMITED') {
    return new ApiError(429, message, errorCode);
  }
  static internal(message = 'Internal server error.', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}
