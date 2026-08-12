/**
 * MediaFire's "direct download" CDN link (download####.mediafire.com/...) is
 * session-scoped and expires after a few hours - storing one statically in
 * Mongo works until it silently goes stale and every install starts failing
 * ("app not found" - the downloaded bytes are MediaFire's expired-link HTML
 * page, not the APK). The share page URL (mediafire.com/file/<key>/<name>/file)
 * does not expire, so we store that instead and re-resolve a fresh direct
 * link from it on every request.
 */

const SHARE_PAGE_RE = /^https:\/\/(www\.)?mediafire\.com\/file\/[^/]+\/[^/]+\/file\/?$/i;
const DIRECT_LINK_RE = /^https:\/\/download\d+\.mediafire\.com\//i;
// github.com/OWNER/REPO/releases/download/TAG/FILE - the plain browser-download link every
// public-repo release asset has. Unlike MediaFire's CDN link this never expires (it 302s to a
// freshly-signed S3 URL on every request), so it needs no re-resolution - fetch() already
// follows the redirect. api.github.com asset URLs are a *different*, auth-gated endpoint and
// are deliberately not matched here.
const GITHUB_RELEASE_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\/[^/]+\/[^/]+$/i;

export function isMediaFireShareLink(url: string): boolean {
  return SHARE_PAGE_RE.test(url.trim());
}

export function isMediaFireDirectLink(url: string): boolean {
  return DIRECT_LINK_RE.test(url.trim());
}

export function isGitHubReleaseLink(url: string): boolean {
  return GITHUB_RELEASE_RE.test(url.trim());
}

/**
 * Resolves a MediaFire share page URL to today's direct-download CDN link by
 * reading the download button's href out of the page HTML. Throws if the
 * page doesn't look like MediaFire's current markup (deleted file, layout
 * change, etc.) so callers can surface a clear error instead of redirecting
 * to garbage.
 */
export async function resolveMediaFireDirectLink(shareUrl: string): Promise<string> {
  const res = await fetch(shareUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`MediaFire page fetch failed (${res.status}).`);
  }
  const html = await res.text();
  const match = html.match(/https:\/\/download\d+\.mediafire\.com\/[^"'<>\s]+/);
  if (!match) {
    throw new Error('Could not find a download link on the MediaFire page — the file may have been removed.');
  }
  return match[0];
}

/** Given whatever URL is stored, return a direct link that is safe to redirect/stream right now. */
export async function toFreshDirectLink(storedUrl: string): Promise<string> {
  const url = storedUrl.trim();
  if (isMediaFireShareLink(url)) return resolveMediaFireDirectLink(url);
  return url;
}
