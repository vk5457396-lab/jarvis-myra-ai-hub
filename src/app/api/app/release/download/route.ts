export const runtime = 'nodejs';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID, AppReleaseDownload } from '@/lib/db/models';
import { auth } from '@/lib/auth/config';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import logger from '../../../_lib/utils/logger';

export const OPTIONS = handleOptions(['GET']);

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** Accepts either a website session (browser /download page) or a mobile JWT (Android app). */
async function resolveUserId(req: NextRequest): Promise<string> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  if (req.headers.get('authorization')) {
    const { user } = await requireMobileUser(req);
    return user._id.toString();
  }

  throw ApiError.unauthorized('Login required to download.', 'AUTH_REQUIRED');
}

/**
 * Asks GitHub for the asset without following the redirect. GitHub answers a
 * release-asset request with a 302 to a short-lived, pre-signed CDN URL that
 * needs no auth — handing that straight to the client is what makes big APK
 * downloads work on phones (resumable, real progress, no serverless timeout).
 * Falls back to the opened 200 response so we can still proxy the bytes.
 */
async function resolveAsset(assetUrl: string): Promise<{ cdnUrl: string | null; upstream: Response | null }> {
  const headers: Record<string, string> = {
    Accept: 'application/octet-stream',
    'User-Agent': 'codeninjavik-download-proxy',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(assetUrl, { headers, redirect: 'manual', cache: 'no-store' });

  if (REDIRECT_STATUSES.has(res.status)) {
    const location = res.headers.get('location');
    await res.body?.cancel().catch(() => {});
    if (location) return { cdnUrl: location, upstream: null };
    return { cdnUrl: null, upstream: null };
  }

  if (!res.ok || !res.body) {
    logger.error('APK asset fetch failed', { status: res.status });
    await res.body?.cancel().catch(() => {});
    return { cdnUrl: null, upstream: null };
  }

  return { cdnUrl: null, upstream: res };
}

/**
 * Hands a logged-in user the APK.
 *
 * - `?mode=url` → JSON `{ url }` with the direct CDN link, so the browser can
 *   download it with its own download manager instead of buffering the whole
 *   APK in memory (that is what used to fail on low-RAM / slow-network phones).
 * - default     → 302 to the same CDN link (Android app + plain links follow it),
 *   or a streamed proxy if GitHub did not hand us a redirect.
 *
 * GITHUB_TOKEN never reaches the client either way.
 */
export const GET = withApi(
  async (req: NextRequest) => {
    const userId = await resolveUserId(req);

    await connectMongo();
    const release = await AppRelease.findById(APP_RELEASE_ID).select('versionName apkAssetUrl').lean();

    if (!release?.apkAssetUrl) {
      throw ApiError.notFound('APK is not available right now.', 'RELEASE_NOT_CONFIGURED');
    }

    const { cdnUrl, upstream } = await resolveAsset(release.apkAssetUrl);
    if (!cdnUrl && !upstream) {
      throw ApiError.internal('Failed to fetch APK from release storage.', 'DOWNLOAD_UPSTREAM_FAILED');
    }

    try {
      await AppReleaseDownload.create({
        userId,
        versionName: release.versionName,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req.headers.get('user-agent') || null,
      });
    } catch {
      // Best-effort analytics only — never block the download over a logging failure.
    }

    const filename = `MYRA-${release.versionName}.apk`;

    if (req.nextUrl.searchParams.get('mode') === 'url') {
      if (upstream) {
        // No CDN link available — tell the client to pull the bytes from us instead.
        await upstream.body?.cancel().catch(() => {});
        return success({ url: '/api/app/release/download', filename, direct: false, version_name: release.versionName });
      }
      return success({ url: cdnUrl, filename, direct: true, version_name: release.versionName });
    }

    if (cdnUrl) {
      const res = NextResponse.redirect(cdnUrl, 302);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    };
    const length = upstream!.headers.get('content-length');
    if (length) headers['Content-Length'] = length;

    return new NextResponse(upstream!.body, { status: 200, headers });
  },
  { rateLimit: { scope: 'app-download', max: 60 } }
);
