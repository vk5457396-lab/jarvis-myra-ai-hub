'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details || {}),
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON body.' });
  }

  if (err && err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ success: false, message: 'Origin not allowed.' });
  }

  logger.error('Unhandled error', {
    path: req.originalUrl,
    message: err && err.message,
    stack: env.isProduction ? undefined : err && err.stack,
  });

  return res.status(500).json({ success: false, message: 'Internal server error.' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
}

module.exports = { errorHandler, notFoundHandler };
