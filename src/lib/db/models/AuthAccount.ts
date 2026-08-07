import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const authAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
  },
  {
    strict: false,
    collection: 'accounts',
  }
);

authAccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export type AuthAccountDoc = InferSchemaType<typeof authAccountSchema>;

export const AuthAccount: Model<AuthAccountDoc> =
  models.AuthAccount || model<AuthAccountDoc>('AuthAccount', authAccountSchema);
