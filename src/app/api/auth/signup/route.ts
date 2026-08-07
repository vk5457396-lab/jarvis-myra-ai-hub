export const runtime = 'nodejs';
export const maxDuration = 30;

import bcrypt from 'bcryptjs';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { requireString, validateEmail, optionalString } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, User } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const email = validateEmail(body.email);
    const password = requireString(body.password, 'password', { min: 8, max: 128 });
    const fullName = optionalString(body.full_name, 'full_name', 120);
    const referralCode = optionalString(body.referral_code, 'referral_code', 32);

    await connectMongo();

    const [existingUser, existingProfile] = await Promise.all([
      User.findOne({ email }).select('_id'),
      Profile.findOne({ email }),
    ]);
    if (existingUser || existingProfile) {
      throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN');
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await Profile.findOne({ referralCode }).select('_id');
      referredBy = referrer?._id ?? null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name: fullName,
      passwordHash,
      authProvider: 'credentials',
      lastLogin: null,
    });

    try {
      await Profile.create({
        email,
        userId: email,
        fullName,
        referredBy,
        role: adminEmails().has(email) ? 'admin' : 'user',
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    return success({ email: user.email }, 'Account created.', 201);
  },
  { rateLimit: { scope: 'auth-signup', max: 20 } }
);
