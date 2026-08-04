import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const telegramAlertSettingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, unique: true },
    botTokenCiphertext: { type: String, required: true },
    botTokenIv: { type: String, required: true },
    botTokenMask: { type: String, required: true },
    chatId: { type: String, required: true },
    isEnabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type TelegramAlertSettingDoc = InferSchemaType<typeof telegramAlertSettingSchema>;

export const TelegramAlertSetting: Model<TelegramAlertSettingDoc> =
  models.TelegramAlertSetting || model<TelegramAlertSettingDoc>('TelegramAlertSetting', telegramAlertSettingSchema);
