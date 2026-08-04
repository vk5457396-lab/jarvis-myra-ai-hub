export const runtime = 'nodejs';
export const maxDuration = 30;

import bcrypt from 'bcryptjs';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { requireString, validateEmail, optionalString } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
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

    const existing = await Profile.findOne({ email });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN');
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await Profile.findOne({ referralCode }).select('_id');
      referredBy = referrer?._id ?? null;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const profile = await Profile.create({
      email,
      userId: email,
      fullName,
      passwordHash,
      referredBy,
      role: adminEmails().has(email) ? 'admin' : 'user',
    });

    return success({ email: profile.email }, 'Account created.', 201);
  },
  { rateLimit: { scope: 'auth-signup', max: 20 } }
);
