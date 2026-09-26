export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { creditReferralCommission } from '../../../_lib/services/referralService';

export const OPTIONS = handleOptions(['POST']);

/**
 * Admin backfill for a sale whose referral commission was missed. The amount and buyer come from
 * Razorpay (never the admin's input), and crediting is idempotent per payment id.
 */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const paymentId = requireString(body.payment_id, 'payment_id', { min: 5, max: 64 });
    const referralCode = requireString(body.referral_code, 'referral_code', { min: 3, max: 32 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw ApiError.internal('Payments are not configured.', 'PAYMENTS_NOT_CONFIGURED');

    const basic = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${basic}` },
    });
    if (!res.ok) throw ApiError.badRequest('Payment not found on Razorpay.', 'PAYMENT_NOT_FOUND');
    const payment = await res.json();
    if (payment.status !== 'captured') {
      throw ApiError.badRequest(`Payment is "${payment.status}", not captured.`, 'PAYMENT_NOT_CAPTURED');
    }

    await connectMongo();
    const credited = await creditReferralCommission({
      referralCode,
      buyerEmail: payment.email || payment.notes?.email || payment.notes?.customer_email,
      paymentId,
      amount: Math.round((payment.amount || 0) / 100),
    });
    if (!credited) {
      throw ApiError.conflict(
        'Nothing credited: already credited for this payment, invalid code, or buyer is the referrer.',
        'REFERRAL_NOT_CREDITED'
      );
    }

    return success(
      { referrer: credited.referrerName, commission: credited.commission },
      `₹${credited.commission} credited to ${credited.referrerName}.`
    );
  },
  { rateLimit: { scope: 'admin-referral-credit', max: 30 } }
);
