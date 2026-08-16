export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { setConnectorEnabled } from '../../../_lib/services/myraAdminService';
import { getDisabledConnectors } from '../../../_lib/services/myraService';
import { CONNECTOR_METADATA, listConnectorIds } from '../../../_lib/services/connectors/registry';

export const OPTIONS = handleOptions(['GET', 'POST']);

/** Admin: every known connector + whether the kill switch has it disabled right now. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const disabled = await getDisabledConnectors();
    const connectors = listConnectorIds().map((id) => ({
      id,
      name: CONNECTOR_METADATA[id].name,
      category: CONNECTOR_METADATA[id].category,
      enabled: !disabled.includes(id),
    }));
    return success({ connectors });
  },
  { rateLimit: { scope: 'admin-myra-connectors', max: 60 } }
);

/** Admin: flip one connector's kill switch. No redeploy - takes effect on the very next
 *  connect/execute/refresh call for that connector, for every user. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const connectorId = String(body.connector_id || '');
    if (typeof body.enabled !== 'boolean') {
      throw ApiError.badRequest('enabled must be a boolean.', 'INVALID_FIELD', { field: 'enabled' });
    }
    const { disabledConnectors } = await setConnectorEnabled({ connectorId, enabled: body.enabled });
    return success({ disabled_connectors: disabledConnectors }, 'Connector updated.');
  },
  { rateLimit: { scope: 'admin-myra-connectors', max: 60 } }
);
