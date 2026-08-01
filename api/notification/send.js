import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success } from '../_utils/response.js';
import { parseNotificationPayload } from '../_utils/notificationPayload.js';
import { dispatchNotification } from '../_services/notificationService.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'notification-send', max: 30 });
  await requireAdmin(req);

  const payload = parseNotificationPayload(req.jsonBody);
  const data = await dispatchNotification(payload);
  return success(res, data, data.scheduled ? 'Notification scheduled.' : 'Notification sent.');
});
