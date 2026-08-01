import { ApiError, failure, json } from '../_utils/response.js';
import logger from '../_utils/logger.js';

const DEFAULT_ORIGINS = ['https://codeninjavik.in', 'https://www.codeninjavik.in'];

function allowedOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function applySecurityHeaders(res) {
  // Helmet-equivalent headers for a pure JSON API.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.removeHeader?.('X-Powered-By');
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const list = allowedOrigins();

  // Android apps send no Origin header - those requests are always allowed.
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (list.includes('*') || list.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    return false;
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'authorization, content-type, x-admin-key, x-device-id, apikey'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

/** Parses a JSON body regardless of whether the platform pre-parsed it. */
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      throw ApiError.badRequest('Malformed JSON body.', 'MALFORMED_JSON');
    }
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw ApiError.badRequest('Payload too large.', 'PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw ApiError.badRequest('Malformed JSON body.', 'MALFORMED_JSON');
  }
}

/**
 * Wraps every route: CORS, security headers, method guard, JSON body parsing
 * and a catch-all error handler that guarantees a JSON response.
 */
export function createHandler(methods, handler) {
  const allowedMethods = Array.isArray(methods) ? methods : [methods];

  return async function wrapped(req, res) {
    applySecurityHeaders(res);

    if (!applyCors(req, res)) {
      return failure(res, 403, 'Origin not allowed.', 'CORS_NOT_ALLOWED');
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    if (!allowedMethods.includes(req.method)) {
      res.setHeader('Allow', allowedMethods.join(', '));
      return failure(res, 405, `Method ${req.method} is not allowed.`, 'METHOD_NOT_ALLOWED');
    }

    try {
      if (req.method === 'POST') {
        req.jsonBody = await parseBody(req);
      } else {
        req.jsonBody = {};
      }
      await handler(req, res);
      if (!res.writableEnded) {
        json(res, 204, { success: true, message: 'OK', data: {} });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return failure(res, error.statusCode, error.message, error.errorCode, error.extra);
      }
      logger.error('Unhandled API error', {
        path: req.url,
        detail: error && error.message,
      });
      return failure(res, 500, 'Internal server error.', 'INTERNAL_ERROR');
    }
  };
}
