/** Plan normalisation, duration and expiry rules shared by every license endpoint. */

export const PLANS = {
  ONE_MONTH: '1_month',
  TWO_MONTHS: '2_months',
  LIFETIME: 'lifetime',
};

const ALIASES: Record<string, string> = {
  '1_month': PLANS.ONE_MONTH,
  '1month': PLANS.ONE_MONTH,
  '1 month': PLANS.ONE_MONTH,
  monthly: PLANS.ONE_MONTH,
  '2_months': PLANS.TWO_MONTHS,
  '2months': PLANS.TWO_MONTHS,
  '2 month': PLANS.TWO_MONTHS,
  '2 months': PLANS.TWO_MONTHS,
  lifetime: PLANS.LIFETIME,
  life_time: PLANS.LIFETIME,
  permanent: PLANS.LIFETIME,
};

const DURATION_DAYS: Record<string, number | null> = {
  [PLANS.ONE_MONTH]: 30,
  [PLANS.TWO_MONTHS]: 60,
  [PLANS.LIFETIME]: null,
};

const LABELS: Record<string, string> = {
  [PLANS.ONE_MONTH]: '1 Month',
  [PLANS.TWO_MONTHS]: '2 Month',
  [PLANS.LIFETIME]: 'Lifetime',
};

export const STATUS = {
  AVAILABLE: 'available',
  ACTIVATED: 'activated',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
};

export function normalizePlan(plan?: string | null): string {
  if (!plan) return PLANS.LIFETIME;
  const key = String(plan).trim().toLowerCase();
  return ALIASES[key] || (Object.values(PLANS).includes(key) ? key : PLANS.LIFETIME);
}

export function planLabel(plan?: string | null): string {
  return LABELS[normalizePlan(plan)] || 'Lifetime';
}

export function planDurationDays(plan?: string | null): number | null {
  return DURATION_DAYS[normalizePlan(plan)] ?? null;
}

/** `null` means the license never expires. */
export function durationDays(license: any): number | null {
  if (license && license.duration !== undefined && license.duration !== null) {
    const n = Number(license.duration);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return planDurationDays(license && license.plan);
}

/** Expiry always starts at the first activation, never at creation. */
export function computeExpiry(license: any, activatedAt: Date | string): string | null {
  const days = durationDays(license);
  if (days === null) return null;
  const base = activatedAt instanceof Date ? activatedAt : new Date(activatedAt);
  return new Date(base.getTime() + days * 86400000).toISOString();
}

export function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function publicLicense(license: any) {
  return {
    license_key: license.license_key,
    plan: planLabel(license.plan),
    plan_id: normalizePlan(license.plan),
    status: license.status,
    device_id: license.device_id || null,
    activated_at: license.activated_at || null,
    expires_at: license.expires_at || null,
  };
}
