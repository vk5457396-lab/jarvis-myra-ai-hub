export const runtime = 'nodejs';
export const maxDuration = 20;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import { executeConnectorTool } from '../../../_lib/services/connectorService';

export const OPTIONS = handleOptions(['POST']);

/** Runs one of a connector's tools (see ConnectorToolSpec on the Android side) using a live,
 *  auto-refreshed access token. The access token itself never leaves this process. */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const connectorId = req.nextUrl.pathname.split('/').slice(-2, -1)[0];
    const body = await req.json();
    const toolId = requireString(body.tool_id, 'tool_id', { min: 1, max: 64 });
    const args: Record<string, string> | undefined =
      body.args && typeof body.args === 'object' ? body.args : undefined;
    const result = await executeConnectorTool(user._id.toString(), connectorId, toolId, args);
    return success(result);
  },
  { rateLimit: { scope: 'connector-execute', max: 60 } }
);
