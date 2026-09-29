import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

// Website event/offer popup, shown once per visit when someone opens codeninjavik.in. Separate from
// MyraBanner (the Android app's in-app popup) so the two can run different campaigns. Only one is
// live at a time: activating a banner deactivates the rest (see the admin PATCH route).
const siteBannerSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, default: '' },
    imageUrl: { type: String, default: null },
    ctaLabel: { type: String, default: null },
    /** Absolute http(s) URL or a site path like "/pricing". */
    ctaUrl: { type: String, default: null },
    /** Short highlight chip, e.g. "40% OFF" or "LIVE EVENT". */
    badge: { type: String, default: null },
    isActive: { type: Boolean, default: false, index: true },
    /** Optional schedule window — outside it the banner is treated as off even when active. */
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'site_banners' }
);

export type SiteBannerDoc = InferSchemaType<typeof siteBannerSchema>;

export const SiteBanner: Model<SiteBannerDoc> =
  models.SiteBanner || model<SiteBannerDoc>('SiteBanner', siteBannerSchema);

export function toPublicSiteBanner(b: any) {
  return {
    id: b._id.toString(),
    title: b.title,
    message: b.message || '',
    image_url: b.imageUrl || null,
    cta_label: b.ctaLabel || null,
    cta_url: b.ctaUrl || null,
    badge: b.badge || null,
    is_active: !!b.isActive,
    starts_at: b.startsAt || null,
    ends_at: b.endsAt || null,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}
