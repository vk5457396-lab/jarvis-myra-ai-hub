'use strict';

const express = require('express');
const licenseRoutes = require('./licenseRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/license', licenseRoutes);

module.exports = router;
