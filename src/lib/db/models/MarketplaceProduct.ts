import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const marketplaceProductSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, default: null },
    description: { type: String, default: null },
    category: { type: String, default: 'general' },
    price: { type: Number, default: 0 },
    // Struck-through "was" price for a discount badge. Only shown when higher than price.
    originalPrice: { type: Number, default: null },
    thumbnailUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    screenshots: { type: [String], default: [] },
    filePath: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
  },
  { timestamps: true }
);

marketplaceProductSchema.index({ isPublished: 1, createdAt: -1 });

export type MarketplaceProductDoc = InferSchemaType<typeof marketplaceProductSchema>;

export const MarketplaceProduct: Model<MarketplaceProductDoc> =
  models.MarketplaceProduct || model<MarketplaceProductDoc>('MarketplaceProduct', marketplaceProductSchema);
