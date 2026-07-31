'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const licenseService = require('../services/licenseService');
const {
  validateLicenseKey,
  validateDeviceId,
  optionalString,
  validatePositiveInt,
} = require('../utils/validators');

const verify = asyncHandler(async (req, res) => {
  const licenseKey = validateLicenseKey(req.body.license_key);
  const deviceId = validateDeviceId(req.body.device_id);
  const appVersion = optionalString(req.body.app_version, 'app_version', 32);
  const androidVersion = optionalString(req.body.android_version, 'android_version', 32);

  const result = await licenseService.verify({ licenseKey, deviceId, appVersion, androidVersion });
  return success(res, 200, result);
});

const check = asyncHandler(async (req, res) => {
  const deviceId = req.body.device_id ? validateDeviceId(req.body.device_id) : null;
  const result = await licenseService.check({ token: req.deviceToken, deviceId });
  return success(res, 200, result);
});

const reset = asyncHandler(async (req, res) => {
  const licenseKey = validateLicenseKey(req.body.license_key);
  const license = await licenseService.resetDevice(licenseKey);
  return success(res, 200, { message: 'Device reset. License is ready for a new activation.', license });
});

const deactivate = asyncHandler(async (req, res) => {
  const licenseKey = validateLicenseKey(req.body.license_key);
  const license = await licenseService.deactivate(licenseKey);
  return success(res, 200, { message: 'License disabled.', license });
});

const renew = asyncHandler(async (req, res) => {
  const licenseKey = validateLicenseKey(req.body.license_key);
  const days = req.body.days === undefined ? null : validatePositiveInt(req.body.days, 'days');
  const plan = optionalString(req.body.plan, 'plan', 32);
  const license = await licenseService.renew(licenseKey, { days, plan });
  return success(res, 200, { message: 'License renewed.', license });
});

const details = asyncHandler(async (req, res) => {
  const licenseKey = validateLicenseKey(req.params.license);
  const license = await licenseService.details(licenseKey);
  return success(res, 200, { license });
});

module.exports = { verify, check, reset, deactivate, renew, details };
