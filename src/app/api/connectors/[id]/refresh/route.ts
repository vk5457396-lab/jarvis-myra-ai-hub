export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { manualRefresh } from '../../../_lib/services/connectorService';

export const OPTIONS = handleOptions(['POST']);

/** Manual "reconnect"/refresh nudge - forces a token refresh now instead of waiting for the
 *  next tool call to discover it's expired. */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const connectorId = req.nextUrl.pathname.split('/').slice(-2, -1)[0];
    await manualRefresh(user._id.toString(), connectorId);
    return success({}, 'Refreshed.');
  },
  { rateLimit: { scope: 'connector-refresh', max: 20 } }
);
