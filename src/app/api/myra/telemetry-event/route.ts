export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../_lib/utils/response';
import { logTelemetryEvent, logTelemetryEventsBatch } from '../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/**
 * App -> backend performance event(s) for Admin > Performance: either a tool-call outcome/
 * duration (from ActionExecutor.execute()) or a voice-turn response latency (from
 * MyraStateManager's PROCESSING -> SPEAKING transition). High volume by design - see
 * MyraTelemetryEvent's TTL.
 *
 * TelemetryReporter (mayra-vikash) now buffers these client-side and flushes a batch, so the
 * common shape going forward is `{ device_id, events: [...] }`. The single-event shape
 * (`{ device_id, type, ... }`, no `events` array) is still accepted for backward compatibility.
 */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    try {
      if (Array.isArray(body.events)) {
        const result = await logTelemetryEventsBatch(user._id, body.device_id || null, body.events);
        return success(result, 'Logged.');
      }
      await logTelemetryEvent(user._id, body.device_id || null, body);
      return success({}, 'Logged.');
    } catch (e) {
      throw ApiError.badRequest(e instanceof Error ? e.message : 'Invalid telemetry event.', 'INVALID_TELEMETRY_EVENT');
    }
  },
  { rateLimit: { scope: 'myra-telemetry-event', max: 300 } }
);
