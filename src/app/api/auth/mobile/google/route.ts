export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import {
  authenticateGoogleForMobile,
  createMobileSession,
} from '../../../_lib/services/mobileAuthService';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const idToken = requireString(body.id_token, 'id_token', { min: 100, max: 10000 });
    const device = body.device && typeof body.device === 'object' ? body.device : {};

    const identity = await authenticateGoogleForMobile(idToken);
    const data = await createMobileSession({
      user: identity.user,
      websiteProfile: identity.profile,
      device,
    });
    return success(data, 'Google login successful.');
  },
  { rateLimit: { scope: 'mobile-google-login', max: 20 } }
);
