export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import {
  hashRefreshToken,
  refreshTokenMatches,
  signMobileTokenPair,
  verifyMobileRefreshToken,
} from '../../../_lib/utils/mobileJwt';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraDevice, Profile, User } from '@/lib/db/models';
import { assertDeviceNotBlocked } from '../../../_lib/services/mobileAuthService';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const refreshToken = requireString(body.refresh_token, 'refresh_token', { min: 100, max: 10000 });
    const deviceId = requireString(body.device_id, 'device_id', { min: 4, max: 256 });
    const claims = verifyMobileRefreshToken(refreshToken);
    if (claims.device_id !== deviceId) {
      throw ApiError.unauthorized('Refresh token is not valid for this device.', 'DEVICE_TOKEN_MISMATCH');
    }
    await assertDeviceNotBlocked(deviceId);

    await connectMongo();
    const [user, device] = await Promise.all([
      User.findById(claims.sub),
      MyraDevice.findOne({ userId: claims.sub, deviceId }).select('+refreshTokenHash'),
    ]);
    if (!user || !device?.refreshTokenHash) {
      throw ApiError.unauthorized('Session is no longer active.', 'SESSION_REVOKED');
    }
    if (!refreshTokenMatches(refreshToken, device.refreshTokenHash)) {
      throw ApiError.unauthorized('Session is no longer active.', 'SESSION_REVOKED');
    }

    const websiteProfile = await Profile.findOne({ email: user.email });
    const role = (websiteProfile?.role || 'user') as 'admin' | 'user';
    const next = signMobileTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role,
      deviceId,
    });

    device.refreshTokenHash = hashRefreshToken(next.refreshToken);
    device.lastLogin = new Date();
    device.isCurrentDevice = true;
    await device.save();

    return success(
      {
        access_token: next.accessToken,
        refresh_token: next.refreshToken,
        token_type: 'Bearer',
        expires_in: next.accessExpiresIn,
        refresh_expires_in: next.refreshExpiresIn,
      },
      'Session refreshed.'
    );
  },
  { rateLimit: { scope: 'mobile-token-refresh', max: 60 } }
);
