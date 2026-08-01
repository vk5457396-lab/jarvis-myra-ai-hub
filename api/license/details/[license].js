import { createHandler } from '../../_middleware/handler.js';
import { rateLimit } from '../../_middleware/rateLimit.js';
import { requireAdmin } from '../../_middleware/admin.js';
import { success } from '../../_utils/response.js';
import { licenseDetails } from '../../_services/licenseService.js';
import { validateLicenseKey } from '../../_utils/validation.js';

export default createHandler('GET', async (req, res) => {
  rateLimit(req, { scope: 'license-admin', max: 60 });
  requireAdmin(req);

  const raw = req.query?.license ?? new URL(req.url, 'http://localhost').pathname.split('/').pop();
  const licenseKey = validateLicenseKey(raw);
  const license = await licenseDetails(licenseKey);
  return success(res, { license }, 'License details.');
});
