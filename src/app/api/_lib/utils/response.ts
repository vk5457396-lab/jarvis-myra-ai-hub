import { NextResponse } from 'next/server';

/**
 * Uniform JSON responses. Every endpoint in this backend uses these helpers so
 * the Android client never receives HTML. Shape is a hard external contract —
 * do not rename fields.
 */

function withNoStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export function success<T>(data: T = {} as T, message = 'OK', statusCode = 200): NextResponse {
  return withNoStore(NextResponse.json({ success: true, message, data }, { status: statusCode }));
}

export function failure(
  statusCode: number,
  message: string,
  errorCode: string,
  extra: Record<string, unknown> = {}
): NextResponse {
  return withNoStore(
    NextResponse.json({ success: false, message, error_code: errorCode, ...extra }, { status: statusCode })
  );
}

export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  extra: Record<string, unknown>;

  constructor(statusCode: number, message: string, errorCode: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.extra = extra || {};
  }

  static badRequest(message: string, errorCode = 'BAD_REQUEST', extra?: Record<string, unknown>) {
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
  static conflict(message: string, errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }
  static tooMany(message = 'Too many requests.', errorCode = 'RATE_LIMITED') {
    return new ApiError(429, message, errorCode);
  }
  static internal(message = 'Internal server error.', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}
