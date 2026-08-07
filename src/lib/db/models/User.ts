import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, default: null },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    googleId: { type: String, default: null, index: true },
    passwordHash: { type: String, default: null, select: false },
    profilePhoto: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ['credentials', 'google', 'both'],
      default: 'credentials',
    },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: Model<UserDoc> = models.User || model<UserDoc>('User', userSchema);
