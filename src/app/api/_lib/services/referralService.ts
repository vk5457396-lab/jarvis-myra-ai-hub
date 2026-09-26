import { Profile, ReferralEarning } from '@/lib/db/models';
import logger from '../utils/logger';

export const REFERRAL_COMMISSION_RATE = 0.05;

type CreditInput = {
  /** Code the buyer arrived with (?ref= / localStorage). Untrusted client input. */
  referralCode?: unknown;
  /** Buyer's email, used to find their profile (for referredBy fallback + self-referral check). */
  buyerEmail?: string | null;
  /** Unique payment id — the idempotency key, so retries never double-credit. */
  paymentId: string;
  /** Server-verified amount in rupees (never the client-supplied amount). */
  amount: number;
};

type CreditResult = { referrerName: string; referralCode: string; commission: number } | null;

/**
 * Credits 5% of a verified sale to the referrer's wallet. The referrer is whoever the buyer's
 * account is bound to (Profile.referredBy, set at signup or first login via a link), else the owner
 * of the referral code sent with the purchase (guest checkout), so it works across devices.
 * Self-referrals are ignored. Idempotent per payment via ReferralEarning's unique index.
 */
export async function creditReferralCommission({ referralCode, buyerEmail, paymentId, amount }: CreditInput): Promise<CreditResult> {
  const commission = Math.floor(amount * REFERRAL_COMMISSION_RATE);
  if (!paymentId || commission <= 0) return null;

  const code = typeof referralCode === 'string' ? referralCode.trim().slice(0, 32) : '';
  const email = typeof buyerEmail === 'string' ? buyerEmail.trim().toLowerCase() : '';

  const buyer = email ? await Profile.findOne({ email }).select('_id referredBy') : null;

  // An account's referrer is permanent once set — a later link from someone else doesn't steal it.
  let referrer = buyer?.referredBy
    ? await Profile.findById(buyer.referredBy).select('_id fullName email referralCode')
    : null;
  if (!referrer && code) {
    referrer = await Profile.findOne({ referralCode: code }).select('_id fullName email referralCode');
  }
  if (!referrer) return null;

  const isSelfReferral =
    (buyer && buyer._id.equals(referrer._id)) || (email && referrer.email && referrer.email.toLowerCase() === email);
  if (isSelfReferral) {
    logger.info('Skipping self-referral commission', { paymentId });
    return null;
  }

  try {
    await ReferralEarning.create({
      referrerId: referrer._id,
      referredUserId: buyer?._id || referrer._id,
      purchaseId: paymentId,
      purchaseAmount: amount,
      commissionAmount: commission,
      status: 'credited',
    });
  } catch (err: any) {
    if (err?.code === 11000) return null; // already credited for this payment
    throw err;
  }

  await Profile.findByIdAndUpdate(referrer._id, { $inc: { walletBalance: commission } });

  return { referrerName: referrer.fullName || 'Unknown', referralCode: referrer.referralCode, commission };
}

/**
 * Binds a signed-in account to the referrer behind `code`, only if it has no referrer yet (covers
 * Google sign-ins and accounts that log in after opening a link). Returns the account's referrer.
 */
export async function claimAndGetReferrer(profileId: string, code?: unknown): Promise<{ id: string; full_name: string } | null> {
  const profile = await Profile.findById(profileId).select('_id referredBy');
  if (!profile) return null;

  const cleanCode = typeof code === 'string' ? code.trim().slice(0, 32) : '';
  if (!profile.referredBy && cleanCode) {
    const referrer = await Profile.findOne({ referralCode: cleanCode }).select('_id');
    if (referrer && !referrer._id.equals(profile._id)) {
      // Conditional update so two tabs racing can't overwrite an already-set referrer.
      await Profile.updateOne({ _id: profile._id, referredBy: null }, { $set: { referredBy: referrer._id } });
      profile.referredBy = referrer._id;
    }
  }
  if (!profile.referredBy) return null;

  const referrer = await Profile.findById(profile.referredBy).select('fullName').lean();
  if (!referrer) return null;
  return { id: (referrer as any)._id.toString(), full_name: (referrer as any).fullName || 'A friend' };
}
