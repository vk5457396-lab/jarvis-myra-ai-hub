export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success } from '../../../../_lib/utils/response';
import { validateDeviceId } from '../../../../_lib/utils/validation';
import { unblockDevice } from '../../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: lift a device block. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const deviceId = validateDeviceId(body.device_id);
    await unblockDevice(deviceId);
    return success({ device_id: deviceId }, 'Device unblocked.');
  },
  { rateLimit: { scope: 'admin-myra-devices-unblock', max: 60 } }
);
