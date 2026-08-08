export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { disconnectConnector } from '../../../_lib/services/connectorService';

export const OPTIONS = handleOptions(['POST']);

/** Revokes the token at the provider where supported, then deletes the local record. */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const connectorId = req.nextUrl.pathname.split('/').slice(-2, -1)[0];
    await disconnectConnector(user._id.toString(), connectorId);
    return success({}, 'Disconnected.');
  },
  { rateLimit: { scope: 'connector-disconnect', max: 20 } }
);
