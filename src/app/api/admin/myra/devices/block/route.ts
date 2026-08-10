export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success } from '../../../../_lib/utils/response';
import { validateDeviceId, optionalString } from '../../../../_lib/utils/validation';
import { blockDevice } from '../../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['POST']);

/**
 * Admin: permanently block a physical device (by its ANDROID_ID) from logging into ANY
 * account. This is independent of any one user - the blocked device stays blocked even if a
 * different email signs in on it. Enforced in mobileAuthService.createMobileSession() and the
 * token-refresh route.
 */
export const POST = withApi(
  async (req) => {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const deviceId = validateDeviceId(body.device_id);
    const reason = optionalString(body.reason, 'reason', 512);

    const blocked = await blockDevice({
      deviceId,
      reason,
      blockedBy: admin.userId || admin.via,
    });

    return success({ device_id: blocked.deviceId, reason: blocked.reason }, 'Device blocked.');
  },
  { rateLimit: { scope: 'admin-myra-devices-block', max: 60 } }
);
