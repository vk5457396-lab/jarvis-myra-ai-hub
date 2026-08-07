import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      authUserId: string;
      role: 'admin' | 'user';
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authUserId?: string;
    profileId?: string;
    role?: 'admin' | 'user';
  }
}
