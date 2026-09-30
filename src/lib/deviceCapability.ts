/**
 * Whether this device/connection should load the heavy WebGL visuals (three.js ~500 KB plus a render
 * loop). On Data Saver, 2G/3G, or low-memory phones those compete with navigation for bandwidth and
 * CPU — the site then feels like buttons don't respond — so the light CSS versions are used instead.
 * Defaults to true where the browser doesn't expose these hints (desktop Safari/Firefox).
 */
export function canRunHeavyVisuals(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const conn = nav.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 3) return false;
  return true;
}
