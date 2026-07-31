'use strict';

const express = require('express');
const controller = require('../controllers/licenseController');
const requireAdmin = require('../middleware/adminAuth');
const { authenticateDevice } = require('../middleware/auth');
const { licenseLimiter, adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Android device endpoints
router.post('/verify', licenseLimiter, controller.verify);
router.post('/check', licenseLimiter, authenticateDevice, controller.check);

// Admin endpoints
router.post('/reset', adminLimiter, requireAdmin, controller.reset);
router.post('/deactivate', adminLimiter, requireAdmin, controller.deactivate);
router.post('/renew', adminLimiter, requireAdmin, controller.renew);
router.get('/details/:license', adminLimiter, requireAdmin, controller.details);

module.exports = router;
