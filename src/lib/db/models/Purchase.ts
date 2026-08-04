import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const PRODUCT_TYPES = [
  'jarvis',
  'myra',
  'bundle',
  'jarvis_source',
  'myra_source',
  'bundle_source',
  'aria',
] as const;

const purchaseSchema = new Schema(
  {
    productName: { type: String, required: true },
    productType: { type: String, enum: PRODUCT_TYPES, required: true, index: true },
    amount: { type: Number, required: true },
    paymentId: { type: String, required: true },
    customerName: { type: String, default: null },
    customerEmail: { type: String, default: null },
    customerPhone: { type: String, default: null },
  },
  { timestamps: true }
);

purchaseSchema.index({ createdAt: -1 });

export type PurchaseDoc = InferSchemaType<typeof purchaseSchema>;

export const Purchase: Model<PurchaseDoc> = models.Purchase || model<PurchaseDoc>('Purchase', purchaseSchema);
