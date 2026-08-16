export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { getAnalyticsSummary } from '../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['GET']);

/** Admin: dashboard counters - users/devices totals, plan mix, automation health. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const summary = await getAnalyticsSummary();
    return success(summary);
  },
  { rateLimit: { scope: 'admin-myra-analytics', max: 60 } }
);
