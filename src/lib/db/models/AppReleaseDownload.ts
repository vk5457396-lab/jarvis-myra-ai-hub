import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const appReleaseDownloadSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    versionName: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

appReleaseDownloadSchema.index({ createdAt: -1 });

export type AppReleaseDownloadDoc = InferSchemaType<typeof appReleaseDownloadSchema>;

export const AppReleaseDownload: Model<AppReleaseDownloadDoc> =
  models.AppReleaseDownload || model<AppReleaseDownloadDoc>('AppReleaseDownload', appReleaseDownloadSchema);
