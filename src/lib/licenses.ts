export type LicensePlan = "1_month" | "2_months" | "lifetime";

export interface LicenseRow {
  id: string;
  license_key: string;
  plan: string;
  duration: number | null;
  status: string;
  device_id: string | null;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  created_by: string | null;
}

export const PLAN_OPTIONS: { value: LicensePlan; label: string; duration: number | null }[] = [
  { value: "1_month", label: "1 Month", duration: 30 },
  { value: "2_months", label: "2 Months", duration: 60 },
  { value: "lifetime", label: "Lifetime", duration: null },
];

export const planLabel = (plan: string) =>
  PLAN_OPTIONS.find((p) => p.value === plan)?.label ?? plan;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(n: number) {
  const bytes = new Uint32Array(n);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Generates e.g. MYRA-ABCD-EFGH-IJKL (length = number of random chars) */
export function generateKey(prefix = "MYRA", length = 16) {
  const raw = randomChars(Math.max(8, length));
  const groups = raw.match(/.{1,4}/g) ?? [raw];
  return `${prefix}-${groups.join("-")}`;
}

export function generateUniqueKeys(count: number, prefix: string, length: number, taken: Set<string>) {
  const keys: string[] = [];
  let guard = 0;
  while (keys.length < count && guard < count * 50) {
    guard++;
    const k = generateKey(prefix, length);
    if (taken.has(k)) continue;
    taken.add(k);
    keys.push(k);
  }
  return keys;
}

export function isExpired(row: LicenseRow) {
  return !!row.expires_at && new Date(row.expires_at).getTime() < Date.now();
}

export function effectiveStatus(row: LicenseRow) {
  if (row.status === "disabled") return "disabled";
  if (isExpired(row)) return "expired";
  return row.status;
}

export function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function downloadFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function licensesToCsv(rows: LicenseRow[]) {
  const header = ["License Key", "Plan", "Status", "Created", "Activated", "Expires", "Device ID"];
  const body = rows.map((r) =>
    [
      r.license_key,
      planLabel(r.plan),
      effectiveStatus(r),
      r.created_at,
      r.activated_at ?? "",
      r.expires_at ?? "",
      r.device_id ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...body].join("\n");
}
