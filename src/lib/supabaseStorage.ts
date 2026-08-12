import { createClient } from '@supabase/supabase-js';

/**
 * Second storage provider alongside Vercel Blob (see admin/blob/upload) - added when Blob's
 * quota filled up. Deliberately Storage-only: this project used to run on Supabase entirely
 * (see the "Replaces the ... Supabase Edge Function" comments across the API routes) and has
 * since moved its database to MongoDB, so nothing here touches Postgres - just the Storage
 * bucket on the same still-live Supabase project.
 *
 * Service-role key, server-only - this client bypasses Storage RLS entirely, so it must never
 * be imported from a "use client" file or exposed to the browser.
 */
function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

/** Single public bucket for admin-uploaded marketing assets (banners, notification images).
 *  Public because these are always meant to be loaded directly by the Android app (Coil/
 *  AsyncImage) with a stable URL and no signing - same trust level as the existing Blob-backed
 *  `/api/marketplace/asset` proxy, just without needing a proxy route since Supabase serves
 *  public-bucket objects directly. */
const BUCKET = 'myra-assets';
let bucketEnsured = false;

async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  const client = supabaseAdmin();
  const { data: buckets } = await client.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true });
    // A concurrent request may have created it a moment earlier - only a real failure matters.
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketEnsured = true;
}

/** Uploads a file to the shared public bucket and returns its permanent public URL. */
export async function uploadToSupabaseStorage(
  pathname: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket();
  const client = supabaseAdmin();
  const { error } = await client.storage.from(BUCKET).upload(pathname, file, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = client.storage.from(BUCKET).getPublicUrl(pathname);
  return data.publicUrl;
}
