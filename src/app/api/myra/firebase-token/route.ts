export const runtime = 'nodejs';
export const maxDuration = 15;

import { getAuth } from 'firebase-admin/auth';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { getFirebaseApp } from '../../_lib/utils/firebaseAdmin';

export const OPTIONS = handleOptions(['GET']);

// Mints a Firebase custom token whose subject is this Mongo user's id, so
// FirebaseAuth.getInstance().signInWithCustomToken(...) on the client leaves
// request.auth.uid equal to the same id Firestore chat security rules compare
// against - one identity, no separate Firebase account to manage.
export const GET = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const uid = user._id.toString();
    const token = await getAuth(getFirebaseApp()).createCustomToken(uid);
    return success({ firebase_token: token, uid });
  },
  { rateLimit: { scope: 'myra-firebase-token', max: 30 } }
);
