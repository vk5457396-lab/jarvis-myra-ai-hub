export const runtime = 'nodejs';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { ApiError, success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID, AppReleaseDownload } from '@/lib/db/models';
import { auth } from '@/lib/auth/config';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { toFreshDirectLink } from '@/lib/mediafire';
import logger from '../../../_lib/utils/logger';

export const OPTIONS = handleOptions(['GET']);

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
 * Hands a logged-in user the APK.
 *
 * `apkAssetUrl` is set from the admin panel to either a MediaFire share page
 * (mediafire.com/file/.../file — stable, never expires) or a direct link on
 * another host (Drive, Dropbox, ...). MediaFire share pages are resolved to a
 * fresh CDN link on every request — MediaFire's actual download link is
 * session-scoped and expires after a few hours, so storing that resolved
 * link instead of the share page (as this route used to) meant installs
 * silently started failing a few hours after every release once the stored
 * link went stale.
 *
 * - `?mode=url` → JSON `{ url }` for the website's download button, which
 *   hands the link to the browser's own download manager — browsers follow
 *   cross-origin redirects and resume downloads far better than a mobile
 *   HTTP client, so this is left as a direct link rather than proxied.
 * - default     → the Android app's in-app updater. This is *proxied*
 *   through our server rather than redirected: OkHttp on-device either
 *   failed to follow MediaFire's redirect or MediaFire rejected a request
 *   coming from a different IP than the one that resolved the link (its
 *   anti-leech check) — either way, "Install Update" produced nothing.
 *   Proxying means the Android app only ever talks to codeninjavik.in.
 */
export const GET = withApi(
  async (req: NextRequest) => {
    const userId = await resolveUserId(req);
    // ?mode=url is only ever sent by the website's own download button (see doc-comment
    // below) - the Android app's in-app updater always calls this route without it. That
    // existing signal is what keeps the public website download independent of the OTA
    // release: the site gets the publicApkAssetUrl the admin explicitly set, never whatever
    // was last pasted in for an app update.
    const isWebsiteDownload = req.nextUrl.searchParams.get('mode') === 'url';

    await connectMongo();
    const release = await AppRelease.findById(APP_RELEASE_ID)
      .select('versionName apkAssetUrl publicVersionName publicApkAssetUrl')
      .lean();

    const assetUrl = isWebsiteDownload
      ? (release?.publicApkAssetUrl ?? release?.apkAssetUrl)
      : release?.apkAssetUrl;
    const versionName = isWebsiteDownload
      ? (release?.publicVersionName ?? release?.versionName)
      : release?.versionName;

    if (!assetUrl) {
      throw ApiError.notFound('APK is not available right now.', 'RELEASE_NOT_CONFIGURED');
    }

    let directUrl: string;
    try {
      directUrl = await toFreshDirectLink(assetUrl);
    } catch (error) {
      logger.error('Failed to resolve APK download link', { detail: (error as Error)?.message });
      throw ApiError.internal('Could not prepare the download link. Try again in a moment.', 'LINK_RESOLVE_FAILED');
    }

    try {
      await AppReleaseDownload.create({
        userId,
        versionName,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req.headers.get('user-agent') || null,
      });
    } catch {
      // Best-effort analytics only — never block the download over a logging failure.
    }

    if (isWebsiteDownload) {
      return success({
        url: directUrl,
        filename: `MYRA-${versionName}.apk`,
        direct: true,
        version_name: versionName,
      });
    }

    const upstream = await fetch(directUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store',
    });
    if (!upstream.ok || !upstream.body) {
      logger.error('APK proxy fetch failed', { status: upstream.status });
      throw ApiError.internal('Failed to fetch the APK from storage. Try again in a moment.', 'DOWNLOAD_UPSTREAM_FAILED');
    }

    const filename = `MYRA-${versionName}.apk`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    };
    const length = upstream.headers.get('content-length');
    if (length) headers['Content-Length'] = length;

    return new NextResponse(upstream.body, { status: 200, headers });
  },
  { rateLimit: { scope: 'app-download', max: 60 } }
);
