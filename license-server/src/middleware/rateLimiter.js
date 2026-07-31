'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function build(max) {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ success: false, message: 'Too many requests. Please retry later.' }),
  });
}

const globalLimiter = build(env.rateLimitMax * 5);
const licenseLimiter = build(env.rateLimitMax);
const adminLimiter = build(Math.max(10, Math.floor(env.rateLimitMax / 2)));

module.exports = { globalLimiter, licenseLimiter, adminLimiter };
