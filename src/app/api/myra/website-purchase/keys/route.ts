export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { auth } from '@/lib/auth/config';
import { listFirebaseAccessKeysForEmail } from '../../../_lib/services/myraAccessKeyFirestoreService';

export const OPTIONS = handleOptions(['GET']);

/** The signed-in user's own MYRA access keys, for the dashboard - Firestore-backed (see
 *  myraAccessKeyFirestoreService.ts), same collection the Android app redeems against. */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user?.email) throw ApiError.unauthorized('Login required.', 'AUTH_REQUIRED');

  const keys = await listFirebaseAccessKeysForEmail(session.user.email);
  return success({ keys });
});
