'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Shared-secret authentication for administrative endpoints. */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const provided = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : (req.headers['x-admin-key'] || '').toString().trim();

  if (!provided || !safeEqual(provided, env.adminApiKey)) {
    return next(ApiError.unauthorized('Admin authorization required.'));
  }
  return next();
}

module.exports = requireAdmin;
