export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { createConnectSession } from '../../../_lib/services/connectorService';

export const OPTIONS = handleOptions(['POST']);

/** Mints a PKCE + state pair server-side and returns the provider's real authorize URL for
 *  the app to open in a browser. The app never sees a client id or client secret. */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const connectorId = req.nextUrl.pathname.split('/').slice(-2, -1)[0];
    const authorizeUrl = await createConnectSession(user._id.toString(), connectorId);
    return success({ authorize_url: authorizeUrl });
  },
  { rateLimit: { scope: 'connector-connect', max: 20 } }
);
