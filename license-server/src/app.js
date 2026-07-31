'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const env = require('./config/env');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      // Native Android clients send no Origin header.
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS_NOT_ALLOWED'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    maxAge: 86400,
  })
);
app.use(compression());
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(requestLogger);
app.use(globalLimiter);

// Always answer JSON, never HTML.
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'MYRA License Server',
    version: '1.0.0',
    endpoints: [
      'POST /api/license/verify',
      'POST /api/license/check',
      'POST /api/license/reset',
      'POST /api/license/deactivate',
      'POST /api/license/renew',
      'GET /api/license/details/:license',
      'GET /api/health',
    ],
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
