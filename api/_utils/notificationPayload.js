import { ApiError } from '../_utils/response.js';
import {
  requireString,
  optionalString,
  optionalUrl,
  validateEnum,
  validateDeviceId,
  validateUuid,
} from '../_utils/validation.js';

export const TARGETS = ['all', 'premium', 'free', 'lifetime', 'device', 'user'];

/** Shared payload parsing for all notification send endpoints. */
export function parseNotificationPayload(body, { target, targetValue } = {}) {
  const title = requireString(body.title, 'title', { min: 1, max: 120 });
  const text = requireString(body.body, 'body', { min: 1, max: 1000 });

  let scheduledAt = null;
  if (body.scheduled_at) {
    const date = new Date(body.scheduled_at);
    if (Number.isNaN(date.getTime())) {
      throw ApiError.badRequest('scheduled_at must be a valid date.', 'INVALID_FIELD', {
        field: 'scheduled_at',
      });
    }
    scheduledAt = date.toISOString();
  }

  let resolvedTarget = target;
  let resolvedValue = targetValue ?? null;

  if (!resolvedTarget) {
    resolvedTarget = validateEnum(body.target, 'target', TARGETS, 'all');
    if (resolvedTarget === 'device') resolvedValue = validateDeviceId(body.device_id);
    if (resolvedTarget === 'user') resolvedValue = validateUuid(body.user_id, 'user_id');
  }

  return {
    title,
    body: text,
    image_url: optionalUrl(body.image_url, 'image_url'),
    deep_link: optionalString(body.deep_link, 'deep_link', 512),
    action: optionalString(body.action, 'action', 64),
    custom_url: optionalUrl(body.custom_url, 'custom_url'),
    notification_type: validateEnum(
      body.notification_type,
      'notification_type',
      ['general', 'update', 'promo', 'alert', 'license'],
      'general'
    ),
    priority: validateEnum(body.priority, 'priority', ['high', 'normal'], 'high'),
    target: resolvedTarget,
    target_value: resolvedValue,
    scheduled_at: scheduledAt,
  };
}
