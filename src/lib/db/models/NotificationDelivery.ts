import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const notificationDeliverySchema = new Schema(
  {
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
    deviceId: { type: String, default: null },
    fcmToken: { type: String, default: null },
    success: { type: Boolean, default: false },
    errorCode: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type NotificationDeliveryDoc = InferSchemaType<typeof notificationDeliverySchema>;

export const NotificationDelivery: Model<NotificationDeliveryDoc> =
  models.NotificationDelivery || model<NotificationDeliveryDoc>('NotificationDelivery', notificationDeliverySchema);
