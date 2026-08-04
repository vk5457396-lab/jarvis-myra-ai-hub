export const runtime = 'nodejs';
export const maxDuration = 30;

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { validateEmail } from '../../_lib/utils/validation';
import { sendEmail } from '../../_lib/utils/email';
import logger from '../../_lib/utils/logger';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const email = validateEmail(body.email);

    await connectMongo();
    const profile = await Profile.findOne({ email });

    // Always return success — never reveal whether an account exists.
    if (profile) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      profile.resetToken = await bcrypt.hash(rawToken, 10);
      profile.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await profile.save();

      const resetUrl = `${process.env.NEXTAUTH_URL || ''}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
      try {
        await sendEmail({
          to: email,
          subject: 'Reset your CodeNinjaVik password',
          html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
      } catch (err) {
        logger.error('Failed to send password reset email', { detail: (err as Error)?.message });
      }
    }

    return success({}, 'If an account exists for this email, a reset link has been sent.');
  },
  { rateLimit: { scope: 'auth-forgot-password', max: 10 } }
);
