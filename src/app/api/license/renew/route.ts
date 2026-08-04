export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { renewLicense } from '../../_lib/services/licenseService';
import { validateLicenseKey, validatePositiveInt, optionalString } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const body = await req.json();
    const licenseKey = validateLicenseKey(body.license_key);
    const days = body.days === undefined || body.days === null ? null : validatePositiveInt(body.days, 'days');
    const plan = optionalString(body.plan, 'plan', 32);

    const license = await renewLicense(licenseKey, { days, plan });
    return success({ license }, 'License renewed.');
  },
  { rateLimit: { scope: 'license-admin', max: 30 } }
);
