'use strict';

const ApiError = require('../utils/ApiError');
const { verifyActivationToken } = require('../services/jwtService');

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  if (typeof req.body?.activation_token === 'string') {
    return req.body.activation_token.trim();
  }
  if (typeof req.body?.token === 'string') {
    return req.body.token.trim();
  }
  return null;
}

/** Device authentication using the activation JWT. */
function authenticateDevice(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    return next(ApiError.unauthorized('Activation token is required.'));
  }
  try {
    req.deviceToken = token;
    req.tokenPayload = verifyActivationToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticateDevice, extractBearer };
