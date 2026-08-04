import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const marketplaceDownloadSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'MarketplaceProduct', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Profile', default: null, index: true },
    customerEmail: { type: String, default: null },
    customerName: { type: String, default: null },
    amount: { type: Number, default: 0 },
    paymentId: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type MarketplaceDownloadDoc = InferSchemaType<typeof marketplaceDownloadSchema>;

export const MarketplaceDownload: Model<MarketplaceDownloadDoc> =
  models.MarketplaceDownload || model<MarketplaceDownloadDoc>('MarketplaceDownload', marketplaceDownloadSchema);
