import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { incrWithWindow } from '@/app/api/_lib/middleware/rateLimit';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClientPromise } from '@/lib/db/mongodbClient';
import { authenticateCredentials, syncAdapterUser } from '@/lib/auth/users';

/** Surfaced to the login page as `result.code === "rate_limited"`. */
class LoginRateLimited extends CredentialsSignin {
  code = 'rate_limited';
}

/**
 * Brute-force guard for email/password sign-in: production logs showed ~20 failed credential
 * logins a minute from automated traffic. Caps attempts per IP (10 / 5 min) and per email
 * (6 / 15 min) before bcrypt ever runs. Fails open on a Redis error, like rateLimit().
 */
async function loginAllowed(email: string, request: Request | undefined): Promise<boolean> {
  const fwd = request?.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const ipWin = 5 * 60_000;
  const emailWin = 15 * 60_000;
  try {
    const [ipCount, emailCount] = await Promise.all([
      incrWithWindow(`rl:login-ip:${ip}:${Math.floor(now / ipWin)}`, ipWin / 1000 + 5),
      incrWithWindow(`rl:login-email:${email}:${Math.floor(now / emailWin)}`, emailWin / 1000 + 5),
    ]);
    return ipCount <= 10 && emailCount <= 6;
  } catch {
    return true;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getMongoClientPromise),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  // Auth.js's default logger only prints `error.cause` when it's shaped as `{ err: Error }`,
  // but checks.ts (the PKCE/state cookie validator) throws `InvalidCheck(msg, { cause: error })`
  // where `cause` IS the raw underlying error - so the default logger's cause-printing branch
  // never fires for InvalidCheck, and Vercel's logs only ever show a useless internal stack
  // trace instead of the real reason (expired cookie, decrypt failure, etc). This surfaces it.
  logger: {
    error(error) {
      console.error(`[auth][error] ${error.name}: ${error.message}`);
      const cause = (error as { cause?: unknown }).cause;
      if (cause instanceof Error) {
        console.error(`[auth][cause] ${cause.name}: ${cause.message}`);
      } else if (cause) {
        console.error('[auth][cause]', cause);
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || '').toLowerCase().trim();
        const password = String(credentials?.password || '');
        if (!email || !password) return null;
        if (!(await loginAllowed(email, request))) throw new LoginRateLimited();

        const result = await authenticateCredentials(email, password);
        if (!result) return null;

        return {
          id: result.profile._id.toString(),
          email: result.user.email,
          name: result.user.name || result.profile.fullName || undefined,
          image: result.user.profilePhoto || result.user.image || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.email) {
        const identity = await syncAdapterUser({
          id: account?.provider === 'google' ? user.id : null,
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account?.provider === 'google' ? account.providerAccountId : null,
        });
        token.authUserId = identity.user._id.toString();
        token.profileId = identity.profile._id.toString();
        token.role = identity.profile.role;
        token.sub = identity.profile._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.profileId || token.sub);
        session.user.authUserId = String(token.authUserId || '');
        session.user.role = (token.role as 'admin' | 'user') || 'user';
      }
      return session;
    },
  },
});
