import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

// Singleton document — always fetched/updated by the fixed _id below.
export const PC_RELEASE_ID = 'singleton';

const pcReleaseSchema = new Schema(
  {
    _id: { type: String, default: PC_RELEASE_ID },
    // MYRA PC Controller (.exe) — always free, no access-key/payment gating. Admin pastes the
    // MediaFire file-page link here (see AdminAppReleasePage "PC Controller" section); the
    // website just opens it in a new tab, so there's no CDN-expiry risk like the direct APK link.
    downloadUrl: { type: String, default: null },
    versionName: { type: String, default: null },
    fileSizeMb: { type: Number, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export type PcReleaseDoc = InferSchemaType<typeof pcReleaseSchema>;

export const PcRelease: Model<PcReleaseDoc> =
  models.PcRelease || model<PcReleaseDoc>('PcRelease', pcReleaseSchema);
