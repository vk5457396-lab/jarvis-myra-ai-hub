export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { verifyLicense } from '../../_lib/services/licenseService';
import { validateDeviceId, validateLicenseKey, optionalString } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const licenseKey = validateLicenseKey(body.license_key);
    const deviceId = validateDeviceId(body.device_id);
    const appVersion = optionalString(body.app_version, 'app_version', 32);
    const androidVersion = optionalString(body.android_version, 'android_version', 32);

    const data = await verifyLicense({ licenseKey, deviceId, appVersion, androidVersion });
    return success(data, 'License verified.');
  },
  { rateLimit: { scope: 'license-verify', max: 30 } }
);
