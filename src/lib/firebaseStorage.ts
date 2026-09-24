import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseApp } from '@/app/api/_lib/utils/firebaseAdmin';

/**
 * Third storage provider for admin-uploaded marketing images (banners, notification pictures) -
 * added after the Supabase project behind supabaseStorage.ts went offline. Reuses the Firebase
 * Admin app already configured for FCM/Firestore, so it needs no new credentials, only
 * FIREBASE_STORAGE_BUCKET.
 *
 * The URL uses a Firebase download token rather than a public ACL, so it works regardless of
 * the bucket's uniform-access setting or Storage security rules, and stays valid permanently.
 */
export function isFirebaseStorageConfigured(): boolean {
  return Boolean(process.env.FIREBASE_STORAGE_BUCKET);
}

/** Uploads a file to the Firebase Storage bucket and returns its permanent download URL. */
export async function uploadToFirebaseStorage(
  pathname: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET!.replace(/^gs:\/\//, '');
  const bucket = getStorage(getFirebaseApp()).bucket(bucketName);
  const token = randomUUID();
  await bucket.file(pathname).save(file, {
    resumable: false,
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(pathname)}?alt=media&token=${token}`;
}
