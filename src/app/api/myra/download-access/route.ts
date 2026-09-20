export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { auth } from '@/lib/auth/config';
import { connectMongo } from '@/lib/db/mongoose';
import { User, MyraProfile } from '@/lib/db/models';
import { generateFirebaseAccessKeys, listFirebaseAccessKeysForEmail } from '../../_lib/services/myraAccessKeyFirestoreService';
import { MYRA_PLANS } from '../../_lib/services/myraService';

export const OPTIONS = handleOptions(['GET']);

/**
 * "Can this account download the Android app for free?" - the /download page paywall check.
 *
 * Access is free (no repeat ₹999 charge) for anyone who has EVER paid for MYRA before this
 * paywall existed: a non-free subscriptionType on their existing Mongo profile (in-app purchase,
 * an admin grant, ...), or any access key already on file for their email (an earlier website
 * purchase). Everyone else has to buy the ₹999 lifetime plan on /download.
 *
 * A payer who passes this check but has no access key yet (e.g. their plan came from an in-app
 * purchase, never a website one) gets one issued right here, lazily, so /dashboard always has
 * something to show them - same Firestore collection the Android app redeems against.
 */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user?.email) throw ApiError.unauthorized('Login required.', 'AUTH_REQUIRED');
  const email = session.user.email.toLowerCase();

  await connectMongo();
  const user = await User.findOne({ email });
  const profile = user ? await MyraProfile.findOne({ userId: user._id }) : null;
  const hasPaidProfile = !!profile && !!profile.subscriptionType && profile.subscriptionType !== 'free';

  const existingKeys = await listFirebaseAccessKeysForEmail(email);
  const hasAccess = hasPaidProfile || existingKeys.length > 0;

  let key = existingKeys[0]?.key ?? null;
  if (hasAccess && !key) {
    // subscriptionType can be a legacy/admin label ("admin", "pro", ...) that isn't one of
    // MYRA_PLANS' own keys - fall back to "membership" (the ₹999 lifetime plan) rather than
    // let an unrecognized plan reject key issuance for an account that's clearly already paid.
    const plan = hasPaidProfile && MYRA_PLANS[profile!.subscriptionType] ? profile!.subscriptionType : 'membership';
    const [issued] = await generateFirebaseAccessKeys({
      plan,
      count: 1,
      assignedEmail: email,
      note: 'Auto-issued for an existing paid account (download-access check)',
      createdBy: 'download_access_grant',
    });
    key = issued.key;
  }

  return success({ has_access: hasAccess, key });
});
