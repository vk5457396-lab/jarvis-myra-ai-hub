export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success } from '../../../../_lib/utils/response';
import { validateDeviceId } from '../../../../_lib/utils/validation';
import { unlinkDevice } from '../../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: free a device from the one-device-one-account lock so a different account can log
 *  into it (e.g. the phone changed hands). */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const deviceId = validateDeviceId(body.device_id);
    await unlinkDevice(deviceId);
    return success({ device_id: deviceId }, 'Device unlinked.');
  },
  { rateLimit: { scope: 'admin-myra-devices-unlink', max: 60 } }
);
