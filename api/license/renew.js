import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success } from '../_utils/response.js';
import { renewLicense } from '../_services/licenseService.js';
import { validateLicenseKey, validatePositiveInt, optionalString } from '../_utils/validation.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'license-admin', max: 30 });
  await requireAdmin(req);

  const body = req.jsonBody;
  const licenseKey = validateLicenseKey(body.license_key);
  const days = body.days === undefined || body.days === null ? null : validatePositiveInt(body.days, 'days');
  const plan = optionalString(body.plan, 'plan', 32);

  const license = await renewLicense(licenseKey, { days, plan });
  return success(res, { license }, 'License renewed.');
});
