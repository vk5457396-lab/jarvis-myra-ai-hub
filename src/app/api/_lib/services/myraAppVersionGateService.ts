import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseApp } from '../utils/firebaseAdmin';

/**
 * Firestore-backed "force update" gate the Android app checks at every cold start, BEFORE
 * login - see SplashActivity.kt / AppUpdateGate.kt. Publishing a new release (see
 * app/release/admin PUT) always raises this to the just-published versionCode, so an older
 * installed APK stops working and shows a blocking "update now" prompt pointed at the public
 * download page - no HTTP call from the app to this website is needed to check it, only a
 * public (unauthenticated) Firestore read of this one document.
 */
const DOC_PATH = { collection: 'myra_config', id: 'app_release' };
const DEFAULT_DOWNLOAD_URL = 'https://codeninjavik.in/download';

export async function publishForceUpdateGate({
  versionCode,
  versionName,
  releaseNotes,
}: {
  versionCode: number;
  versionName: string;
  releaseNotes?: string | null;
}) {
  const db = getFirestore(getFirebaseApp());
  await db.collection(DOC_PATH.collection).doc(DOC_PATH.id).set(
    {
      minSupportedVersionCode: versionCode,
      latestVersionName: versionName,
      downloadUrl: DEFAULT_DOWNLOAD_URL,
      updateMessage: releaseNotes || null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
