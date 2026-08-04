export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { parseNotificationPayload } from '../../_lib/utils/notificationPayload';
import { dispatchNotification } from '../../_lib/services/notificationService';
import { validateDeviceId } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const body = await req.json();
    const deviceId = validateDeviceId(body.device_id);
    const payload = parseNotificationPayload(body, { target: 'device', targetValue: deviceId });
    const data = await dispatchNotification(payload);
    return success(data, data.scheduled ? 'Notification scheduled.' : 'Notification sent.');
  },
  { rateLimit: { scope: 'notification-send', max: 60 } }
);
