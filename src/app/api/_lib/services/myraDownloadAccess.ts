import { User, MyraProfile } from '@/lib/db/models';
import { listFirebaseAccessKeysForEmail } from './myraAccessKeyFirestoreService';

/**
 * The single rule for "may this website account download MYRA for Android without buying again":
 * a non-free plan on their MYRA profile (in-app purchase, admin grant, ...) or any access key on file
 * for their email (an earlier website purchase). Used by both the /download button check and the
 * APK download endpoint itself, so the paywall is enforced server-side, not just hidden in the UI.
 */
export async function getMyraDownloadAccess(emailRaw: string) {
  const email = emailRaw.toLowerCase();
  const user = await User.findOne({ email });
  const profile: any = user ? await MyraProfile.findOne({ userId: user._id }) : null;
  const hasPaidProfile = !!profile && !!profile.subscriptionType && profile.subscriptionType !== 'free';
  const existingKeys = await listFirebaseAccessKeysForEmail(email);
  return {
    email,
    profile,
    hasPaidProfile,
    existingKeys,
    hasAccess: hasPaidProfile || existingKeys.length > 0,
  };
}
