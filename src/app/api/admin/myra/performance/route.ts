export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { getPerformanceSummary } from '../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['GET']);

/** Admin: tool-call volume/latency/failures per tool, and voice-response latency trend. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const summary = await getPerformanceSummary();
    return success(summary);
  },
  { rateLimit: { scope: 'admin-myra-performance', max: 60 } }
);
