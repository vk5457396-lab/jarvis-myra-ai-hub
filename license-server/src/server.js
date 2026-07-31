'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(env.port, '0.0.0.0', () => {
  logger.info(`MYRA License Server listening on port ${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully.`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason && reason.message });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message });
  shutdown('uncaughtException');
});

module.exports = server;
