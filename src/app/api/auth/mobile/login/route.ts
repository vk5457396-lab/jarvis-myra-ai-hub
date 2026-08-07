export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString, validateEmail } from '../../../_lib/utils/validation';
import { authenticateCredentials } from '@/lib/auth/users';
import { createMobileSession } from '../../../_lib/services/mobileAuthService';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const email = validateEmail(body.email);
    const password = requireString(body.password, 'password', { min: 1, max: 128 });
    const device = body.device && typeof body.device === 'object' ? body.device : {};

    const identity = await authenticateCredentials(email, password);
    if (!identity) {
      throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const data = await createMobileSession({
      user: identity.user,
      websiteProfile: identity.profile,
      device,
    });
    return success(data, 'Login successful.');
  },
  { rateLimit: { scope: 'mobile-login', max: 20 } }
);
