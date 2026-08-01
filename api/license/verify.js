import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { success } from '../_utils/response.js';
import { verifyLicense } from '../_services/licenseService.js';
import {
  validateDeviceId,
  validateLicenseKey,
  optionalString,
} from '../_utils/validation.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'license-verify', max: 30 });

  const body = req.jsonBody;
  const licenseKey = validateLicenseKey(body.license_key);
  const deviceId = validateDeviceId(body.device_id);
  const appVersion = optionalString(body.app_version, 'app_version', 32);
  const androidVersion = optionalString(body.android_version, 'android_version', 32);

  const data = await verifyLicense({ licenseKey, deviceId, appVersion, androidVersion });
  return success(res, data, 'License verified.');
});
