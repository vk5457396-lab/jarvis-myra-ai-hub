export const runtime = 'nodejs';
export const maxDuration = 30;

import bcrypt from 'bcryptjs';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { requireString, validateEmail } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, User } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const email = validateEmail(body.email);
    const token = requireString(body.token, 'token', { min: 10, max: 256 });
    const password = requireString(body.password, 'password', { min: 8, max: 128 });

    await connectMongo();
    const profile = await Profile.findOne({ email });

    if (!profile?.resetToken || !profile.resetTokenExpiresAt || profile.resetTokenExpiresAt < new Date()) {
      throw ApiError.badRequest('Reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
    }

    const valid = await bcrypt.compare(token, profile.resetToken);
    if (!valid) {
      throw ApiError.badRequest('Reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ email }).select('+passwordHash');
    const authProvider = existingUser?.googleId ? 'both' : 'credentials';

    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          passwordHash,
          authProvider,
          name: existingUser?.name || profile.fullName || null,
        },
        $setOnInsert: { email },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    profile.passwordHash = null;
    profile.resetToken = null;
    profile.resetTokenExpiresAt = null;
    await profile.save();

    return success({}, 'Password updated. You can now log in.');
  },
  { rateLimit: { scope: 'auth-reset-password', max: 20 } }
);
