import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success } from '../_utils/response.js';
import { generateLicenses } from '../_services/licenseService.js';
import { validateEnum, validatePositiveInt, optionalString } from '../_utils/validation.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'license-generate', max: 20 });
  await requireAdmin(req);

  const body = req.jsonBody;
  const plan = validateEnum(body.plan, 'plan', ['1_month', '2_months', 'lifetime'], 'lifetime');
  const quantity = body.quantity === undefined ? 1 : validatePositiveInt(body.quantity, 'quantity', 500);
  const prefix = optionalString(body.prefix, 'prefix', 12);
  const length = body.length === undefined ? null : validatePositiveInt(body.length, 'length', 32);

  const data = await generateLicenses({ plan, quantity, prefix, length });
  return success(res, data, 'Licenses generated and stored.', 201);
});
