/**
 * Client-side APK download helper.
 *
 * The old flow buffered the whole APK with `res.blob()` before saving it, which
 * ran out of memory (or timed out) on plenty of real phones — that is the
 * "download failed" users were hitting. Now we only ask the API for a direct
 * link and hand it to the browser's own download manager, which streams it,
 * shows progress, and can resume on a flaky mobile connection.
 */

export interface AppDownloadResult {
  ok: boolean;
  /** Direct link, kept so the UI can offer a manual "didn't start? tap here" fallback. */
  url?: string;
  message?: string;
}

export async function startAppDownload(): Promise<AppDownloadResult> {
  try {
    const res = await fetch('/api/app/release/download?mode=url', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success || !body?.data?.url) {
      return { ok: false, message: body?.message || 'Download failed. Please try again.' };
    }

    const url: string = body.data.url;
    openDownload(url);
    return { ok: true, url };
  } catch {
    return { ok: false, message: 'Download failed. Check your connection and try again.' };
  }
}

/** Anchor-click instead of `location.href` — in-app browsers handle it far better. */
export function openDownload(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
