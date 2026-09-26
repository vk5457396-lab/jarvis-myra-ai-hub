/** The referral code the visitor arrived with: `?ref=` on the current URL, else the one ReferralBanner saved. */
export function getStoredReferralCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const fromUrl = new URLSearchParams(window.location.search).get("ref");
  if (fromUrl) return fromUrl;
  try {
    return localStorage.getItem("referral_code") || undefined;
  } catch {
    return undefined;
  }
}
