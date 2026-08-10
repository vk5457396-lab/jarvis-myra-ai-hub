import { OAuth2Client } from 'google-auth-library';
import { ApiError } from '../utils/response';
import { hashRefreshToken, signMobileTokenPair } from '../utils/mobileJwt';
import { ensureMyraState, publicMyraProfile, publicUser, upsertMyraDevice } from './myraService';
import { syncAdapterUser } from '@/lib/auth/users';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraBlockedDevice } from '@/lib/db/models';

/** Throws if this physical device (by ANDROID_ID) has been admin-blocked - regardless of
 *  which account is signing in on it. Call before minting any token. */
export async function assertDeviceNotBlocked(deviceId: string) {
  await connectMongo();
  const blocked = await MyraBlockedDevice.findOne({ deviceId }).lean();
  if (blocked) {
    throw ApiError.forbidden('This device has been blocked.', 'DEVICE_BLOCKED');
  }
}

function googleAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.MYRA_ANDROID_GOOGLE_CLIENT_ID,
  ].filter((value): value is string => Boolean(value));
}

export async function verifyGoogleIdToken(idToken: string) {
  const audiences = googleAudiences();
  if (!audiences.length) {
    throw ApiError.internal('Google authentication is not configured.', 'GOOGLE_AUTH_NOT_CONFIGURED');
  }

  try {
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken,
      audience: audiences,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw ApiError.unauthorized('Google account could not be verified.', 'INVALID_GOOGLE_TOKEN');
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Google account could not be verified.', 'INVALID_GOOGLE_TOKEN');
  }
}

export async function createMobileSession({
  user,
  websiteProfile,
  device,
}: {
  user: any;
  websiteProfile: any;
  device: Record<string, any>;
}) {
  const deviceId = String(device.device_id || '').trim();
  if (!deviceId) {
    throw ApiError.badRequest('device_id is required.', 'DEVICE_ID_REQUIRED');
  }
  await assertDeviceNotBlocked(deviceId);

  const role = (websiteProfile?.role || 'user') as 'admin' | 'user';
  const tokenPair = signMobileTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role,
    deviceId,
  });
  const myraState = await ensureMyraState(user, websiteProfile);
  await upsertMyraDevice(user._id, device, hashRefreshToken(tokenPair.refreshToken));

  return {
    access_token: tokenPair.accessToken,
    refresh_token: tokenPair.refreshToken,
    token_type: 'Bearer',
    expires_in: tokenPair.accessExpiresIn,
    refresh_expires_in: tokenPair.refreshExpiresIn,
    user: publicUser(user, role),
    profile: publicMyraProfile(myraState.profile),
  };
}

export async function authenticateGoogleForMobile(idToken: string) {
  const payload = await verifyGoogleIdToken(idToken);
  return syncAdapterUser({
    email: payload.email!,
    name: payload.name || null,
    image: payload.picture || null,
    googleId: payload.sub,
  });
}
