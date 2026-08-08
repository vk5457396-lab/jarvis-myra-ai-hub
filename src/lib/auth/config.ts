import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/db/mongodbClient';
import { authenticateCredentials, syncAdapterUser } from '@/lib/auth/users';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
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
      async authorize(credentials) {
        const email = String(credentials?.email || '').toLowerCase().trim();
        const password = String(credentials?.password || '');
        if (!email || !password) return null;

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
