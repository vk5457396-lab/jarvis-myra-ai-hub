import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { authenticateDevice } from '../_middleware/auth.js';
import { success } from '../_utils/response.js';
import { checkLicense } from '../_services/licenseService.js';
import { validateDeviceId } from '../_utils/validation.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'license-check', max: 60 });
  authenticateDevice(req);

  const body = req.jsonBody;
  const deviceId = body.device_id ? validateDeviceId(body.device_id) : null;

  const data = await checkLicense({ token: req.deviceToken, deviceId });
  return success(res, data, 'License is valid.');
});
