'use strict';

const env = require('../config/env');

function stamp() {
  return new Date().toISOString();
}

const logger = {
  info(message, meta) {
    console.log(`[${stamp()}] INFO  ${message}`, meta !== undefined ? meta : '');
  },
  warn(message, meta) {
    console.warn(`[${stamp()}] WARN  ${message}`, meta !== undefined ? meta : '');
  },
  error(message, meta) {
    console.error(`[${stamp()}] ERROR ${message}`, meta !== undefined ? meta : '');
  },
  debug(message, meta) {
    if (env.isProduction) return;
    console.log(`[${stamp()}] DEBUG ${message}`, meta !== undefined ? meta : '');
  },
};

module.exports = logger;
