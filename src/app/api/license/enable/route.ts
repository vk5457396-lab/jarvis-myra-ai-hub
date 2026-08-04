export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { enableLicense } from '../../_lib/services/licenseService';
import { validateLicenseKey } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const body = await req.json();
    const licenseKey = validateLicenseKey(body.license_key);
    const license = await enableLicense(licenseKey);
    return success({ license }, 'License enabled.');
  },
  { rateLimit: { scope: 'license-admin', max: 30 } }
);
