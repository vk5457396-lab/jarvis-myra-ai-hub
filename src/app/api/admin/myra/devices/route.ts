export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { validateEmail } from '../../../_lib/utils/validation';
import { findUserByEmail, listUserDevices } from '../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['GET']);

/** Admin: every device a user has logged in from, with each one's block status, by email. */
export const GET = withApi(
  async (req) => {
    await requireAdmin(req);
    const email = validateEmail(new URL(req.url).searchParams.get('email'));
    const { user } = await findUserByEmail(email);
    const devices = await listUserDevices(user);
    return success({ devices });
  },
  { rateLimit: { scope: 'admin-myra-devices', max: 60 } }
);
