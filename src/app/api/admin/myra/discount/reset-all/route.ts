export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success } from '../../../../_lib/utils/response';
import { resetAllDiscounts } from '../../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: clear the sitewide discount AND every individual user's coupon back to 0% in one
 *  call - see resetAllDiscounts() for why this needs to be its own endpoint rather than just
 *  zeroing the global value. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const { usersCleared } = await resetAllDiscounts();
    return success(
      { users_cleared: usersCleared },
      `All discounts reset to 0%. ${usersCleared} user coupon(s) cleared.`
    );
  },
  { rateLimit: { scope: 'admin-myra-discount-reset-all', max: 10 } }
);
