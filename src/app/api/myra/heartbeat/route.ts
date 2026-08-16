export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { requireString } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

/**
 * Disabled: Admin > Live Devices heartbeat ingestion is turned off. Still authenticates and
 * validates the payload shape so any caller still hitting this gets the same 2xx envelope as
 * before instead of a 404/error, but no longer touches MyraDevice - device rows just stop being
 * refreshed by heartbeats.
 */
export const POST = withApi(
  async (req) => {
    await requireMobileUser(req);
    const body = await req.json();
    requireString(body.device_id, 'device_id', { min: 4, max: 256 });
    return success({ last_heartbeat_at: null });
  },
  { rateLimit: { scope: 'myra-heartbeat', max: 120 } }
);
