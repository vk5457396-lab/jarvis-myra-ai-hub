'use strict';

/**
 * Wraps an async express handler so rejected promises reach the error middleware.
 * @param {Function} fn
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
