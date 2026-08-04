import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/db/mongodbClient';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile } from '@/lib/db/models';

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Mirrors the old handle_new_user / assign_admin_on_signup triggers — ensures every
 * logged-in identity (Google or Credentials) has a corresponding Profile document,
 * and bootstraps the admin role from ADMIN_EMAILS on first creation. */
async function ensureProfile(email: string, fullName?: string | null) {
  await connectMongo();
  const normalizedEmail = email.toLowerCase();
  let profile = await Profile.findOne({ email: normalizedEmail });
  if (!profile) {
    profile = await Profile.create({
      email: normalizedEmail,
      fullName: fullName || null,
      userId: normalizedEmail,
      role: adminEmails().has(normalizedEmail) ? 'admin' : 'user',
    });
  }
  return profile;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').toLowerCase().trim();
        const password = String(credentials?.password || '');
        if (!email || !password) return null;

        await connectMongo();
        const profile = await Profile.findOne({ email });
        if (!profile?.passwordHash) return null;

        const valid = await bcrypt.compare(password, profile.passwordHash);
        if (!valid) return null;

        return {
          id: profile._id.toString(),
          email: profile.email,
          name: profile.fullName || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const profile = await ensureProfile(user.email, user.name);
        token.profileId = profile._id.toString();
        token.role = profile.role;
        token.sub = profile._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.profileId || token.sub);
        session.user.role = (token.role as 'admin' | 'user') || 'user';
      }
      return session;
    },
  },
});
