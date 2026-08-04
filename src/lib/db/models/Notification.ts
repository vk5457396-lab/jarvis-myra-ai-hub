import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: { type: String, default: null },
    deepLink: { type: String, default: null },
    action: { type: String, default: null },
    customUrl: { type: String, default: null },
    notificationType: { type: String, default: 'general' },
    priority: { type: String, default: 'high' },
    target: { type: String, default: 'all' },
    targetValue: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
    status: { type: String, default: 'pending' },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;

export const Notification: Model<NotificationDoc> =
  models.Notification || model<NotificationDoc>('Notification', notificationSchema);
