export const runtime = 'nodejs';

import { auth } from '@/lib/auth/config';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, User } from '@/lib/db/models';
import { signMobileWebHandoffToken } from '@/app/api/_lib/utils/mobileJwt';

const LOGIN_URL = '/login?redirect=myra%3A%2F%2Fauth';

export async function GET(req: Request) {
  const session = await auth();
  const authUserId = session?.user?.authUserId;
  const email = session?.user?.email?.trim().toLowerCase();

  if (!authUserId || !email) {
    return Response.redirect(new URL(LOGIN_URL, req.url), 302);
  }

  await connectMongo();
  const user = await User.findById(authUserId);
  if (!user || user.email !== email) {
    return Response.redirect(new URL(LOGIN_URL, req.url), 302);
  }

  const profile = await Profile.findOne({ email: user.email });
  const role = (profile?.role || session.user.role || 'user') as 'admin' | 'user';
  const token = signMobileWebHandoffToken({
    userId: user._id.toString(),
    email: user.email,
    role,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `myra://auth?token=${encodeURIComponent(token)}`,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
