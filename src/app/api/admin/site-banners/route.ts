export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { SiteBanner, toPublicSiteBanner } from '@/lib/db/models';
import { parseSiteBannerInput } from '../../_lib/services/siteBannerService';

export const OPTIONS = handleOptions(['GET', 'POST']);

/** Admin: every website offer popup, newest first. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();
  const banners = await SiteBanner.find().sort({ createdAt: -1 }).lean();
  return success({ banners: banners.map(toPublicSiteBanner) });
});

/** Admin: create a popup. Starts off unless `activate` is true (then every other one is turned off). */
export const POST = withApi(
  async (req) => {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const fields = parseSiteBannerInput(body);
    await connectMongo();

    const activate = body.activate === true;
    if (activate) await SiteBanner.updateMany({ isActive: true }, { $set: { isActive: false } });
    const banner = await SiteBanner.create({ ...fields, isActive: activate, createdBy: admin.userId ?? admin.via });

    return success({ banner: toPublicSiteBanner(banner) }, activate ? 'Popup is live.' : 'Popup saved.', 201);
  },
  { rateLimit: { scope: 'admin-site-banners', max: 60 } }
);
