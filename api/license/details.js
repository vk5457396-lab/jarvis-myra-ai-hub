import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success } from '../_utils/response.js';
import { licenseDetails } from '../_services/licenseService.js';
import { validateLicenseKey } from '../_utils/validation.js';

/** POST /api/license/details  { license_key }  (GET /api/license/details?license_key=... also works) */
export default createHandler(['GET', 'POST'], async (req, res) => {
  rateLimit(req, { scope: 'license-admin', max: 60 });
  await requireAdmin(req);

  const url = new URL(req.url, 'http://localhost');
  const raw = req.jsonBody?.license_key || url.searchParams.get('license_key');
  const licenseKey = validateLicenseKey(raw);
  const license = await licenseDetails(licenseKey);
  return success(res, { license }, 'License details.');
});
