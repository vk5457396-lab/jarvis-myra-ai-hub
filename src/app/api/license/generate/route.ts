export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { generateLicenses } from '../../_lib/services/licenseService';
import { validateEnum, validatePositiveInt, optionalString } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const body = await req.json();
    const plan = validateEnum(body.plan, 'plan', ['1_month', '2_months', 'lifetime'], 'lifetime');
    const quantity = body.quantity === undefined ? 1 : validatePositiveInt(body.quantity, 'quantity', 500);
    const prefix = optionalString(body.prefix, 'prefix', 12);
    const length = body.length === undefined ? null : validatePositiveInt(body.length, 'length', 32);

    const data = await generateLicenses({ plan, quantity, prefix, length });
    return success(data, 'Licenses generated and stored.', 201);
  },
  { rateLimit: { scope: 'license-generate', max: 20 } }
);
