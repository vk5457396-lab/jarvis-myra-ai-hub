import { Schema, model, models, type Model } from 'mongoose';

// Singleton (fixed _id) for website-wide settings the admin edits without a redeploy.
//
// offlineSales: real sales the website database never saw — sold over Telegram, direct UPI, in the
// Android app, or before this site existed. The homepage sales counter adds these to the sales it
// counts itself, so the public number reflects the business's actual total.
const siteSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'singleton' },
    offlineSales: {
      jarvis: { type: Number, default: 0, min: 0 },
      myra: { type: Number, default: 0, min: 0 },
      bundle: { type: Number, default: 0, min: 0 },
      /** Real sales whose product isn't known — counted in the total only. */
      other: { type: Number, default: 0, min: 0 },
    },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'site_settings' }
);

export const SITE_SETTINGS_ID = 'singleton';

export const SiteSettings: Model<any> = models.SiteSettings || model('SiteSettings', siteSettingsSchema);
