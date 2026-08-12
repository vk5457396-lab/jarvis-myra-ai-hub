export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEmail } from '../../../_lib/utils/validation';
import { findUserByEmail, setDiscountPercent } from '../../../_lib/services/myraAdminService';
import { publicMyraProfile } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: set a per-user coupon-style discount % (0 clears it), by email. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const email = validateEmail(body.email);
    const discountPercent = Number(body.discount_percent);
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      throw ApiError.badRequest('discount_percent must be a number between 0 and 100.', 'INVALID_DISCOUNT');
    }

    const { user } = await findUserByEmail(email);
    const profile = await setDiscountPercent({ user, discountPercent });

    return success({ profile: publicMyraProfile(profile) }, 'Discount updated.');
  },
  { rateLimit: { scope: 'admin-myra-discount', max: 60 } }
);
