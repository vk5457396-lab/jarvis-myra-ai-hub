import { ApiError } from '../utils/response';
import { optionalString, optionalUrl } from '../utils/validation';

/** Site path ("/pricing#myra") or absolute http(s) URL — the popup's button can point either way. */
function ctaUrl(value: unknown): string | null {
  const str = optionalString(value, 'cta_url', 2048);
  if (!str) return null;
  if (str.startsWith('/') && !str.startsWith('//')) return str;
  return optionalUrl(str, 'cta_url');
}

function optionalDate(value: unknown, field: string): Date | null {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw ApiError.badRequest(`${field} must be a valid date.`, 'INVALID_FIELD', { field });
  return d;
}

/**
 * Maps request-body fields onto SiteBanner fields. With `partial`, only keys present in the body are
 * returned (PATCH); otherwise title is required (POST).
 */
export function parseSiteBannerInput(body: any, { partial = false } = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const has = (k: string) => !partial || body[k] !== undefined;

  if (has('title')) {
    const title = optionalString(body.title, 'title', 120);
    if (!title) throw ApiError.badRequest('title is required.', 'MISSING_FIELD', { field: 'title' });
    out.title = title;
  }
  if (has('message')) out.message = optionalString(body.message, 'message', 500) ?? '';
  if (has('image_url')) out.imageUrl = optionalUrl(body.image_url, 'image_url');
  if (has('cta_label')) out.ctaLabel = optionalString(body.cta_label, 'cta_label', 40);
  if (has('cta_url')) out.ctaUrl = ctaUrl(body.cta_url);
  if (has('badge')) out.badge = optionalString(body.badge, 'badge', 24);
  if (has('starts_at')) out.startsAt = optionalDate(body.starts_at, 'starts_at');
  if (has('ends_at')) out.endsAt = optionalDate(body.ends_at, 'ends_at');

  const starts = out.startsAt as Date | null | undefined;
  const ends = out.endsAt as Date | null | undefined;
  if (starts && ends && ends <= starts) {
    throw ApiError.badRequest('End time must be after the start time.', 'INVALID_SCHEDULE');
  }
  return out;
}
