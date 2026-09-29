export const runtime = 'nodejs';
export const maxDuration = 30;

import mongoose from 'mongoose';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { SiteBanner, toPublicSiteBanner } from '@/lib/db/models';
import { parseSiteBannerInput } from '../../../_lib/services/siteBannerService';

export const OPTIONS = handleOptions(['PATCH', 'DELETE']);

function idFromPath(pathname: string): string {
  const id = pathname.split('/').pop() || '';
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Popup not found.', 'SITE_BANNER_NOT_FOUND');
  return id;
}

/** Admin: edit a popup and/or turn it on/off. Turning one on turns every other one off. */
export const PATCH = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = idFromPath(req.nextUrl.pathname);
    const body = await req.json();
    const fields = parseSiteBannerInput(body, { partial: true });
    await connectMongo();

    if (typeof body.is_active === 'boolean') {
      fields.isActive = body.is_active;
      if (body.is_active) {
        await SiteBanner.updateMany({ _id: { $ne: id }, isActive: true }, { $set: { isActive: false } });
      }
    }

    const banner = await SiteBanner.findByIdAndUpdate(id, { $set: fields }, { new: true });
    if (!banner) throw ApiError.notFound('Popup not found.', 'SITE_BANNER_NOT_FOUND');
    return success({ banner: toPublicSiteBanner(banner) }, 'Popup updated.');
  },
  { rateLimit: { scope: 'admin-site-banners', max: 60 } }
);

export const DELETE = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = idFromPath(req.nextUrl.pathname);
    await connectMongo();
    const deleted = await SiteBanner.findByIdAndDelete(id);
    if (!deleted) throw ApiError.notFound('Popup not found.', 'SITE_BANNER_NOT_FOUND');
    return success({}, 'Popup deleted.');
  },
  { rateLimit: { scope: 'admin-site-banners', max: 60 } }
);
