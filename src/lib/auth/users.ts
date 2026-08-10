import bcrypt from 'bcryptjs';
import { connectMongo } from '@/lib/db/mongoose';
import { AuthAccount, Profile, User } from '@/lib/db/models';

export function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => normalizedEmail(email))
      .filter(Boolean)
  );
}

/** Single source of truth for "is this an admin/owner account" - same ADMIN_EMAILS list the
 *  website's own role assignment uses, so chat's admin badge can never drift from it. */
export function isAdminEmail(emailValue: string): boolean {
  return adminEmails().has(normalizedEmail(emailValue));
}

export async function ensureWebsiteProfile(
  emailValue: string,
  fullName?: string | null
) {
  await connectMongo();
  const email = normalizedEmail(emailValue);
  let profile = await Profile.findOne({ email });

  if (!profile) {
    profile = await Profile.create({
      email,
      fullName: fullName || null,
      userId: email,
      role: adminEmails().has(email) ? 'admin' : 'user',
    });
  } else if (!profile.fullName && fullName) {
    profile.fullName = fullName;
    await profile.save();
  }

  return profile;
}

export async function findCanonicalUserByEmail(emailValue: string) {
  await connectMongo();
  const email = normalizedEmail(emailValue);
  let user = await User.findOne({ email }).select('+passwordHash');

  if (!user?.passwordHash) {
    const legacyProfile = await Profile.findOne({ email });
    if (legacyProfile?.passwordHash) {
      user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            email,
            name: legacyProfile.fullName || null,
            createdAt: legacyProfile.createdAt || new Date(),
          },
          $set: {
            passwordHash: legacyProfile.passwordHash,
            authProvider: user?.googleId ? 'both' : 'credentials',
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).select('+passwordHash');
    }
  }

  return user;
}

export async function authenticateCredentials(emailValue: string, password: string) {
  const email = normalizedEmail(emailValue);
  const user = await findCanonicalUserByEmail(email);
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  user.lastLogin = new Date();
  if (!user.authProvider) user.authProvider = user.googleId ? 'both' : 'credentials';
  await user.save();

  const profile = await ensureWebsiteProfile(email, user.name);
  return { user, profile };
}

export async function syncAdapterUser({
  id,
  email: emailValue,
  name,
  image,
  googleId,
}: {
  id?: string | null;
  email: string;
  name?: string | null;
  image?: string | null;
  googleId?: string | null;
}) {
  await connectMongo();
  const email = normalizedEmail(emailValue);
  let user = id ? await User.findById(id).select('+passwordHash') : null;
  if (!user) user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    user = await User.create({
      email,
      name: name || null,
      image: image || null,
      profilePhoto: image || null,
      googleId: googleId || null,
      emailVerified: googleId ? new Date() : null,
      authProvider: googleId ? 'google' : 'credentials',
      lastLogin: new Date(),
    });
  } else {
    user.name = user.name || name || null;
    user.image = image || user.image || null;
    user.profilePhoto = image || user.profilePhoto || null;
    user.googleId = googleId || user.googleId || null;
    user.lastLogin = new Date();
    if (googleId) user.emailVerified = user.emailVerified || new Date();
    user.authProvider =
      user.passwordHash && (googleId || user.googleId) ? 'both' :
      (googleId || user.googleId) ? 'google' : 'credentials';
    await user.save();
  }

  if (googleId) {
    await AuthAccount.findOneAndUpdate(
      { provider: 'google', providerAccountId: googleId },
      {
        $set: {
          userId: user._id,
          type: 'oidc',
          provider: 'google',
          providerAccountId: googleId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const profile = await ensureWebsiteProfile(email, name || user.name);
  return { user, profile };
}
