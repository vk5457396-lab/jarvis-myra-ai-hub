export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import { hashRefreshToken, verifyMobileWebHandoffToken } from '../../../_lib/utils/mobileJwt';
import { createMobileSession } from '../../../_lib/services/mobileAuthService';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraDevice, Profile, User } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const token = requireString(body.token, 'token', { min: 100, max: 10000 });
    const device = body.device && typeof body.device === 'object' ? body.device : {};
    const deviceId = requireString(device.device_id, 'device.device_id', { min: 4, max: 256 });
    const claims = verifyMobileWebHandoffToken(token);

    await connectMongo();
    const user = await User.findById(claims.sub);
    if (!user || user.email !== claims.email.toLowerCase()) {
      throw ApiError.unauthorized('User account not found.', 'USER_NOT_FOUND');
    }

    try {
      await MyraDevice.findOneAndUpdate(
        { userId: user._id, deviceId, webHandoffHash: { $ne: hashRefreshToken(token) } },
        {
          $set: { webHandoffHash: hashRefreshToken(token) },
          $setOnInsert: { userId: user._id, deviceId },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        throw ApiError.unauthorized(
          'Authentication handoff has already been used.',
          'WEB_HANDOFF_ALREADY_USED'
        );
      }
      throw error;
    }

    const websiteProfile = await Profile.findOne({ email: user.email });
    const data = await createMobileSession({ user, websiteProfile, device });
    return success(data, 'Website login completed.');
  },
  { rateLimit: { scope: 'mobile-web-login', max: 30 } }
);
