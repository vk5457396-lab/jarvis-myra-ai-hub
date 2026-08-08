import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const marketplaceProductSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, default: null },
    description: { type: String, default: null },
    category: { type: String, default: 'general' },
    price: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    screenshots: { type: [String], default: [] },
    filePath: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
    // Set only on the one product that represents the official MYRA Android APK —
    // lets the app-update system reuse this same upload flow instead of a second admin page.
    versionName: { type: String, default: null },
    versionCode: { type: Number, default: null },
    isAppRelease: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

marketplaceProductSchema.index({ isPublished: 1, createdAt: -1 });

export type MarketplaceProductDoc = InferSchemaType<typeof marketplaceProductSchema>;

export const MarketplaceProduct: Model<MarketplaceProductDoc> =
  models.MarketplaceProduct || model<MarketplaceProductDoc>('MarketplaceProduct', marketplaceProductSchema);
