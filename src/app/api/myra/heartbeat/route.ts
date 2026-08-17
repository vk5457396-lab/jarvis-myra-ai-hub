export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { requireString } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

/**
 * Disabled: Admin > Live Devices heartbeat ingestion is turned off. No Mongo access at all here
 * on purpose - old installs still hitting this endpoint would otherwise cost a real DB read (auth
 * lookup) and write (rate-limit bucket) per request even though nothing is actually stored.
 * Handlers stay auth-free and DB-free, just echoing a same-shaped 2xx so any caller still hitting
 * this keeps working with zero backend cost, and device rows just stop being refreshed.
 */
export const POST = withApi(async (req) => {
  const body = await req.json();
  requireString(body.device_id, 'device_id', { min: 4, max: 256 });
  return success({ last_heartbeat_at: null });
});
