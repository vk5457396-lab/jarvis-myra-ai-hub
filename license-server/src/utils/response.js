'use strict';

function success(res, statusCode, payload) {
  return res.status(statusCode).json({ success: true, ...payload });
}

function failure(res, statusCode, message, details) {
  return res.status(statusCode).json({ success: false, message, ...(details || {}) });
}

module.exports = { success, failure };
