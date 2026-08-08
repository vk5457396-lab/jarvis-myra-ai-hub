export const runtime = 'nodejs';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { ApiError } from '../../../_lib/utils/response';
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
 * Streams the APK from the private GitHub release to a logged-in user.
 * GITHUB_TOKEN never reaches the browser — this route fetches server-side
 * and pipes the response body straight through.
 */
export const GET = withApi(
  async (req: NextRequest) => {
    const userId = await resolveUserId(req);

    await connectMongo();
    const release = await AppRelease.findById(APP_RELEASE_ID).select('versionName apkAssetUrl').lean();

    if (!release?.apkAssetUrl) {
      throw ApiError.notFound('APK is not available right now.', 'RELEASE_NOT_CONFIGURED');
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw ApiError.internal('Download is not configured.', 'GITHUB_TOKEN_MISSING');

    const ghRes = await fetch(release.apkAssetUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/octet-stream',
        'User-Agent': 'codeninjavik-download-proxy',
      },
    });

    if (!ghRes.ok || !ghRes.body) {
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

    const filename = `CodeNinjaVik-${release.versionName}.apk`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${filename}"`,
    };
    const length = ghRes.headers.get('content-length');
    if (length) headers['Content-Length'] = length;

    return new NextResponse(ghRes.body, { status: 200, headers });
  },
  { rateLimit: { scope: 'app-download', max: 15 } }
);
