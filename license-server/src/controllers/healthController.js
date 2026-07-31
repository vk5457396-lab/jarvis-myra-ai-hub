'use strict';

const asyncHandler = require('../utils/asyncHandler');
const repo = require('../services/licenseRepository');

const health = asyncHandler(async (req, res) => {
  const connected = await repo.ping();
  return res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = { health };
