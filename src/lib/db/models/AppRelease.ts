import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

// Singleton document — always fetched/updated by the fixed _id below.
export const APP_RELEASE_ID = 'singleton';

const appReleaseSchema = new Schema(
  {
    _id: { type: String, default: APP_RELEASE_ID },
    // Drives the in-app OTA updater (GET /api/app/release, the mobile-authed branch of
    // /api/app/release/download) and the "app_update" push notification - set every time a new
    // GitHub release in vk5457396-lab/myra_apk is cut.
    versionName: { type: String, default: '1.0.0' },
    versionCode: { type: Number, default: 1 },
    releaseNotes: { type: String, default: null },
    fileSizeMb: { type: Number, default: null },
    apkAssetUrl: { type: String, default: null },
    // SHA-256 of the exact bytes at apkAssetUrl - lets the Android updater verify what it
    // downloaded before installing, instead of trusting the OS installer to reject a
    // corrupted/wrong file after the download has already completed. Must be re-set (or left
    // stale, which the app tolerates by skipping the check) every time apkAssetUrl changes.
    sha256: { type: String, default: null },
    updatedBy: { type: String, default: null },
    // Deliberately separate from the OTA fields above: what the public website's /download page
    // (and the home/pricing download cards) shows and links to. Only changes when explicitly
    // edited via the "Public Website Download" admin section - publishing a new OTA release
    // must NOT move these. null until the admin sets them for the first time, at which point
    // the public consumers stop falling back to the OTA fields and become fully independent.
    publicVersionName: { type: String, default: null },
    publicReleaseNotes: { type: String, default: null },
    publicFileSizeMb: { type: Number, default: null },
    publicApkAssetUrl: { type: String, default: null },
    publicUpdatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export type AppReleaseDoc = InferSchemaType<typeof appReleaseSchema>;

export const AppRelease: Model<AppReleaseDoc> =
  models.AppRelease || model<AppReleaseDoc>('AppRelease', appReleaseSchema);
