import { BlobNotFoundError, BlobStoreNotFoundError, BlobStoreSuspendedError } from '@vercel/blob';
import { ApiError } from './response';

/**
 * Turns a thrown Blob SDK error into an honest ApiError.
 *
 * Both blob-backed routes used to collapse *every* failure into a plain 404
 * "Asset not found", which hid a suspended Blob store for days — the images
 * and paid downloads were dead site-wide and the API kept insisting the files
 * simply did not exist. Anything that is not genuinely a missing blob now
 * reports as a storage failure and gets logged with the real message.
 */
export function toBlobApiError(error: unknown): ApiError {
  const message = (error as Error)?.message ?? '';

  if (error instanceof BlobStoreSuspendedError || /suspended/i.test(message)) {
    return new ApiError(
      503,
      'File storage is suspended — downloads and images are temporarily unavailable.',
      'BLOB_STORE_SUSPENDED'
    );
  }

  if (error instanceof BlobStoreNotFoundError || /store not found/i.test(message)) {
    return new ApiError(503, 'File storage is not reachable right now.', 'BLOB_STORE_NOT_FOUND');
  }

  if (error instanceof BlobNotFoundError || /not found|404/i.test(message)) {
    return ApiError.notFound('Asset not found.', 'ASSET_NOT_FOUND');
  }

  if (/access denied|forbidden|403|401|token/i.test(message)) {
    return new ApiError(502, 'File storage rejected this request.', 'BLOB_ACCESS_DENIED');
  }

  return new ApiError(502, 'Could not read the file from storage.', 'BLOB_READ_FAILED');
}
