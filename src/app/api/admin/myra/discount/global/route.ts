export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success } from '../../../../_lib/utils/response';
import { setGlobalDiscount } from '../../../../_lib/services/myraAdminService';
import { getGlobalDiscountPercent } from '../../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['GET', 'POST']);

/** Admin: current sitewide "apply to all users" discount %. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const discountPercent = await getGlobalDiscountPercent();
    return success({ discount_percent: discountPercent });
  },
  { rateLimit: { scope: 'admin-myra-discount-global', max: 60 } }
);

/** Admin: set (or clear, with 0) the sitewide discount applied to every user's next order. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const discountPercent = Number(body.discount_percent);
    const settings = await setGlobalDiscount({ discountPercent });
    return success({ discount_percent: settings.discountPercent }, 'Global discount updated.');
  },
  { rateLimit: { scope: 'admin-myra-discount-global', max: 60 } }
);
