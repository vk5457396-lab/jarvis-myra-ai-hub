export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { ApiError, success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID, AppReleaseDownload } from '@/lib/db/models';
import { auth } from '@/lib/auth/config';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';

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
 * Hands a logged-in user the APK link.
 *
 * `apkAssetUrl` is a direct-download link on an external host (MediaFire,
 * Google Drive, Dropbox, etc.) set from the admin panel — nothing is uploaded
 * to or proxied through this project, so there is no storage/bandwidth to run
 * out of here. It must be a link that serves the APK bytes directly (no
 * share/interstitial page): the Android app's in-app auto-updater streams
 * this same URL and needs real APK bytes, not HTML.
 *
 * - `?mode=url` → JSON `{ url }` for the website's download button.
 * - default     → 302 redirect to the same URL, which the Android app's
 *   OkHttp client follows automatically.
 */
export const GET = withApi(
  async (req: NextRequest) => {
    const userId = await resolveUserId(req);

    await connectMongo();
    const release = await AppRelease.findById(APP_RELEASE_ID).select('versionName apkAssetUrl').lean();

    if (!release?.apkAssetUrl) {
      throw ApiError.notFound('APK is not available right now.', 'RELEASE_NOT_CONFIGURED');
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

    if (req.nextUrl.searchParams.get('mode') === 'url') {
      return success({
        url: release.apkAssetUrl,
        filename: `MYRA-${release.versionName}.apk`,
        direct: true,
        version_name: release.versionName,
      });
    }

    const res = NextResponse.redirect(release.apkAssetUrl, 302);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  },
  { rateLimit: { scope: 'app-download', max: 60 } }
);
