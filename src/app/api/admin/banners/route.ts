export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { requireString, optionalString, optionalUrl } from '../../_lib/utils/validation';
import { listBanners, createBanner } from '../../_lib/services/myraAdminService';
import { publicBanner } from '../../_lib/services/myraService';

export const OPTIONS = handleOptions(['GET', 'POST']);

/** Admin: list every banner ever created (active or not) for the manager UI. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  const banners = await listBanners();
  return success({ banners: banners.map(publicBanner) });
});

/** Admin: create a new banner. Starts inactive - flip it on via PATCH .../[id]. */
export const POST = withApi(
  async (req) => {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const title = requireString(body.title, 'title', { min: 1, max: 120 });
    const message = requireString(body.message, 'message', { min: 1, max: 500 });
    const imageUrl = optionalUrl(body.image_url, 'image_url');
    const ctaLabel = optionalString(body.cta_label, 'cta_label', 40);
    const ctaUrl = optionalUrl(body.cta_url, 'cta_url');

    const banner = await createBanner({
      title,
      message,
      imageUrl,
      ctaLabel,
      ctaUrl,
      createdBy: admin.userId ?? admin.via,
    });

    return success({ banner: publicBanner(banner) }, 'Banner created.');
  },
  { rateLimit: { scope: 'admin-banners-create', max: 60 } }
);
