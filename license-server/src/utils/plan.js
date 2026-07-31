'use strict';

const {
  PLANS,
  PLAN_ALIASES,
  PLAN_DURATION_DAYS,
  PLAN_LABELS,
} = require('../config/constants');

/** Normalise any stored/incoming plan string to a canonical plan key. */
function normalizePlan(plan) {
  if (!plan) return PLANS.LIFETIME;
  const key = String(plan).trim().toLowerCase();
  return PLAN_ALIASES[key] || (Object.values(PLANS).includes(key) ? key : PLANS.LIFETIME);
}

function planLabel(plan) {
  return PLAN_LABELS[normalizePlan(plan)] || 'Lifetime';
}

/**
 * Duration in days for a license row. An explicit `duration` column wins,
 * otherwise the plan default is used. `null` = never expires.
 */
function durationDays(license) {
  if (license && license.duration !== undefined && license.duration !== null) {
    const n = Number(license.duration);
    if (Number.isFinite(n) && n > 0) return n;
    return null;
  }
  return PLAN_DURATION_DAYS[normalizePlan(license && license.plan)] ?? null;
}

/** Expiry computed from the activation instant, never from creation date. */
function computeExpiry(license, activatedAt) {
  const days = durationDays(license);
  if (days === null) return null;
  const base = activatedAt instanceof Date ? activatedAt : new Date(activatedAt);
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

module.exports = { normalizePlan, planLabel, durationDays, computeExpiry, isExpired };
