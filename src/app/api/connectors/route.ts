export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../_lib/middleware/handler';
import { requireMobileUser } from '../_lib/middleware/mobileAuth';
import { success } from '../_lib/utils/response';
import { listConnectorsForUser } from '../_lib/services/connectorService';

export const OPTIONS = handleOptions(['GET']);

/** Every known connector's metadata + this user's live connection status for each. */
export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const connectors = await listConnectorsForUser(user._id.toString());
  return success({ connectors });
});
