import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success } from '../_utils/response.js';
import { deactivateLicense } from '../_services/licenseService.js';
import { validateLicenseKey } from '../_utils/validation.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'license-admin', max: 30 });
  await requireAdmin(req);

  const licenseKey = validateLicenseKey(req.jsonBody.license_key);
  const license = await deactivateLicense(licenseKey);
  return success(res, { license }, 'License disabled.');
});
