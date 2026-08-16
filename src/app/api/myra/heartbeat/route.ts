export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../_lib/utils/response';
import { requireString } from '../../_lib/utils/validation';
import { upsertHeartbeat } from '../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/**
 * App -> backend live telemetry for Admin > Live Devices. Called on the app's own state
 * transitions (Listening/Processing/Speaking/Idle, Gemini Live connect/reconnect/disconnect)
 * plus a periodic safety-net timer - not solely on a fixed interval, so a state that's stuck
 * shows up promptly rather than only at the next tick. Cheap and best-effort: never blocks or
 * retries anything on the app side, a dropped heartbeat just means one slightly stale admin row.
 */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const deviceId = requireString(body.device_id, 'device_id', { min: 4, max: 256 });
    try {
      const device = await upsertHeartbeat(user._id, deviceId, body);
      return success({ last_heartbeat_at: device.lastHeartbeatAt });
    } catch (e) {
      throw ApiError.badRequest(e instanceof Error ? e.message : 'Invalid heartbeat payload.', 'INVALID_HEARTBEAT');
    }
  },
  { rateLimit: { scope: 'myra-heartbeat', max: 120 } }
);
