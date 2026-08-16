export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { listLiveDevices } from '../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['GET']);

/** Admin: every device with at least one heartbeat, most recently active first. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const devices = await listLiveDevices();
    return success({ devices });
  },
  { rateLimit: { scope: 'admin-myra-live-devices', max: 60 } }
);
