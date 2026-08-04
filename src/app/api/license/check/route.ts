export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { authenticateDevice } from '../../_lib/middleware/auth';
import { success } from '../../_lib/utils/response';
import { checkLicense } from '../../_lib/services/licenseService';
import { validateDeviceId } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const { deviceToken } = authenticateDevice(req);

    const body = await req.json();
    const deviceId = body.device_id ? validateDeviceId(body.device_id) : null;

    const data = await checkLicense({ token: deviceToken, deviceId });
    return success(data, 'License is valid.');
  },
  { rateLimit: { scope: 'license-check', max: 60 } }
);
