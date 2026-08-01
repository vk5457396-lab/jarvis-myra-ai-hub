import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success } from '../_utils/response.js';
import { parseNotificationPayload } from '../_utils/notificationPayload.js';
import { dispatchNotification } from '../_services/notificationService.js';
import { validateUuid } from '../_utils/validation.js';

export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'notification-send', max: 60 });
  requireAdmin(req);

  const userId = validateUuid(req.jsonBody.user_id, 'user_id');
  const payload = parseNotificationPayload(req.jsonBody, { target: 'user', targetValue: userId });
  const data = await dispatchNotification(payload);
  return success(res, data, data.scheduled ? 'Notification scheduled.' : 'Notification sent.');
});
