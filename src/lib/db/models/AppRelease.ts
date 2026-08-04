import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

// Singleton document — always fetched/updated by the fixed _id below.
export const APP_RELEASE_ID = 'singleton';

const appReleaseSchema = new Schema(
  {
    _id: { type: String, default: APP_RELEASE_ID },
    versionName: { type: String, default: '1.0.0' },
    versionCode: { type: Number, default: 1 },
    releaseNotes: { type: String, default: null },
    fileSizeMb: { type: Number, default: null },
    apkAssetUrl: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export type AppReleaseDoc = InferSchemaType<typeof appReleaseSchema>;

export const AppRelease: Model<AppReleaseDoc> =
  models.AppRelease || model<AppReleaseDoc>('AppRelease', appReleaseSchema);
