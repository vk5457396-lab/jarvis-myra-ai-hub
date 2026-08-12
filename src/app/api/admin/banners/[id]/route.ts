export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { optionalString, optionalUrl } from '../../../_lib/utils/validation';
import { updateBanner, deleteBanner } from '../../../_lib/services/myraAdminService';
import { publicBanner } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['PATCH', 'DELETE']);

function bannerIdFromPath(req: { nextUrl: { pathname: string } }): string {
  return req.nextUrl.pathname.split('/').pop() as string;
}

/** Admin: edit a banner's content and/or flip isActive (simple manual on/off - see the schema
 *  comment). Every field is optional so this doubles as the "just toggle active" endpoint. */
export const PATCH = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = bannerIdFromPath(req);
    const body = await req.json();
    const fields: Record<string, unknown> = {};

    const title = optionalString(body.title, 'title', 120);
    if (title !== null) fields.title = title;
    const message = optionalString(body.message, 'message', 500);
    if (message !== null) fields.message = message;
    if (body.image_url !== undefined) fields.imageUrl = optionalUrl(body.image_url, 'image_url');
    if (body.cta_label !== undefined) fields.ctaLabel = optionalString(body.cta_label, 'cta_label', 40);
    if (body.cta_url !== undefined) fields.ctaUrl = optionalUrl(body.cta_url, 'cta_url');
    if (typeof body.is_active === 'boolean') fields.isActive = body.is_active;

    const banner = await updateBanner(id, fields);
    return success({ banner: publicBanner(banner) }, 'Banner updated.');
  },
  { rateLimit: { scope: 'admin-banners-update', max: 120 } }
);

export const DELETE = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = bannerIdFromPath(req);
    await deleteBanner(id);
    return success({}, 'Banner deleted.');
  },
  { rateLimit: { scope: 'admin-banners-delete', max: 60 } }
);
