import { Schema, model, models, type Model } from 'mongoose';

export const REVIEW_APPS = ['myra-android', 'myra-pc'] as const;
export type ReviewApp = (typeof REVIEW_APPS)[number];

// Store-style ratings & reviews on /download. One review per user per app (editing replaces it).
// MYRA for Android reviews are only accepted from accounts that bought it (verified purchase).
const appReviewSchema = new Schema(
  {
    app: { type: String, enum: REVIEW_APPS, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    displayName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'app_reviews' }
);

appReviewSchema.index({ app: 1, userId: 1 }, { unique: true });
appReviewSchema.index({ app: 1, createdAt: -1 });

export const AppReview: Model<any> = models.AppReview || model('AppReview', appReviewSchema);

export function toPublicReview(r: any) {
  return {
    id: r._id.toString(),
    name: r.displayName,
    rating: r.rating,
    text: r.text || '',
    verified: !!r.verified,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}
