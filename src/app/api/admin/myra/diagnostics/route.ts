export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { listAutomationErrors } from '../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['GET']);

/** Admin: recent automation failures, newest first. Optional ?failure_type= filter. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const failureType = new URL(req.url).searchParams.get('failure_type') || undefined;
    const errors = await listAutomationErrors({ failureType });
    return success({ errors });
  },
  { rateLimit: { scope: 'admin-myra-diagnostics', max: 60 } }
);
