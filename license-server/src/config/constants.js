'use strict';

/**
 * Plan identifiers stored in the `licenses.plan` column.
 * Both the legacy admin-panel values and human readable values are supported.
 */
const PLANS = {
  ONE_MONTH: '1_month',
  TWO_MONTHS: '2_months',
  LIFETIME: 'lifetime',
};

const PLAN_ALIASES = {
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

/** Duration in days per plan. `null` means the plan never expires. */
const PLAN_DURATION_DAYS = {
  [PLANS.ONE_MONTH]: 30,
  [PLANS.TWO_MONTHS]: 60,
  [PLANS.LIFETIME]: null,
};

const PLAN_LABELS = {
  [PLANS.ONE_MONTH]: '1 Month',
  [PLANS.TWO_MONTHS]: '2 Month',
  [PLANS.LIFETIME]: 'Lifetime',
};

const STATUS = {
  AVAILABLE: 'available',
  ACTIVATED: 'activated',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
};

module.exports = { PLANS, PLAN_ALIASES, PLAN_DURATION_DAYS, PLAN_LABELS, STATUS };
