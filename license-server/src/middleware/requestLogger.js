'use strict';

const morgan = require('morgan');
const env = require('../config/env');
const logger = require('../utils/logger');

const stream = {
  write: (message) => logger.info(message.trim()),
};

/** Compact request logging; never logs bodies so license keys stay out of logs. */
const requestLogger = morgan(env.isProduction ? 'combined' : 'dev', { stream });

module.exports = requestLogger;
