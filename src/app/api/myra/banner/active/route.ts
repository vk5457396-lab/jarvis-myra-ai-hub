export const runtime = 'nodejs';
export const maxDuration = 20;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { getActiveBanner } from '../../../_lib/services/myraAdminService';
import { publicBanner } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['GET']);

/** The Android app calls this once per app open. `banner: null` means nothing is active right
 *  now - the client shows nothing rather than an empty popup. */
export const GET = withApi(async (req) => {
  await requireMobileUser(req);
  const banner = await getActiveBanner();
  return success({ banner: banner ? publicBanner(banner) : null });
});
