export const runtime = 'nodejs';
export const maxDuration = 30;

import crypto from 'node:crypto';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString, validateEnum } from '../../../_lib/utils/validation';
import { auth } from '@/lib/auth/config';
import { MYRA_PLANS } from '../../../_lib/services/myraService';
import {
  claimPaymentOnce,
  generateFirebaseAccessKeys,
  keyForPayment,
  recordKeyForPayment,
  releasePaymentLock,
} from '../../../_lib/services/myraAccessKeyFirestoreService';
import logger from '../../../_lib/utils/logger';
import { connectMongo } from '@/lib/db/mongoose';
import { creditReferralCommission } from '../../../_lib/services/referralService';

export const OPTIONS = handleOptions(['POST']);

function validSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * Verifies the Razorpay payment and issues a MYRA access key for the plan, assigned to the
 * buyer's email. Firestore-backed (see myraAccessKeyFirestoreService.ts) - the Android app
 * redeems this key directly against Firestore, with no further HTTP call to this website.
 */
export const POST = withApi(
  async (req) => {
    const session = await auth();
    if (!session?.user?.email) throw ApiError.unauthorized('Login required.', 'AUTH_REQUIRED');
    const email = session.user.email.toLowerCase();

    const body = await req.json();
    const plan = validateEnum(body.plan, 'plan', ['basic', 'premium', 'elite', 'elite_pro', 'membership']);
    const orderId = requireString(body.order_id, 'order_id', { min: 5, max: 128 });
    const paymentId = requireString(body.payment_id, 'payment_id', { min: 5, max: 128 });
    const signature = requireString(body.signature, 'signature', { min: 20, max: 512 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw ApiError.internal('Payments are not configured.', 'PAYMENTS_NOT_CONFIGURED');
    if (!validSignature(orderId, paymentId, signature, keySecret)) {
      throw ApiError.unauthorized('Invalid payment signature.', 'INVALID_PAYMENT_SIGNATURE');
    }

    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${authorization}` },
    });
    if (!orderResponse.ok) {
      logger.error('MYRA website purchase order verification failed', { detail: await orderResponse.text() });
      throw ApiError.internal('Payment could not be verified.', 'PAYMENT_VERIFICATION_FAILED');
    }
    const order = await orderResponse.json();
    const planConfig = MYRA_PLANS[plan];
    const expectedAmount = planConfig.price * 100;
    if (
      order.id !== orderId ||
      order.amount !== expectedAmount ||
      order.notes?.type !== 'myra_website_purchase' ||
      order.notes?.plan !== plan ||
      order.notes?.email !== email
    ) {
      throw ApiError.badRequest('Payment details do not match the selected plan.', 'PAYMENT_MISMATCH');
    }

    // Check the payment itself, not order.amount_paid: Razorpay can capture a few seconds after
    // Checkout returns, and order.amount_paid stays 0 until then — the buyer would be charged with
    // no key issued. An authorized-but-uncaptured payment is captured here.
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${authorization}` },
    });
    if (!paymentResponse.ok) {
      logger.error('MYRA website purchase payment lookup failed', { detail: await paymentResponse.text() });
      throw ApiError.internal('Payment could not be verified.', 'PAYMENT_VERIFICATION_FAILED');
    }
    const payment = await paymentResponse.json();
    if (payment.order_id !== orderId || payment.amount !== expectedAmount) {
      throw ApiError.badRequest('Payment details do not match the selected plan.', 'PAYMENT_MISMATCH');
    }
    if (payment.status === 'authorized') {
      const captureResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
        method: 'POST',
        headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: expectedAmount, currency: 'INR' }),
      });
      if (!captureResponse.ok) {
        const detail = await captureResponse.text();
        // Already captured by auto-capture in the meantime is fine; anything else is a real failure.
        if (!/already been captured/i.test(detail)) {
          logger.error('MYRA website purchase capture failed', { detail });
          throw ApiError.internal('Payment could not be completed. You have not been charged twice; contact support.', 'PAYMENT_CAPTURE_FAILED');
        }
      }
    } else if (payment.status !== 'captured') {
      throw ApiError.badRequest(`Payment is ${payment.status}, not completed.`, 'PAYMENT_NOT_COMPLETED');
    }

    // Atomic dedupe: a retried verify call (network retry, double click) for the SAME payment
    // must never issue a second key - claimPaymentOnce() only succeeds the first time.
    const claimed = await claimPaymentOnce(paymentId);
    if (!claimed) {
      // Retry of an already-verified payment: hand back the same key instead of an error.
      const existing = await keyForPayment(paymentId);
      if (existing) return success({ key: existing, plan, plan_price: planConfig.price }, 'Access key issued.');
      throw ApiError.conflict('This payment is still being processed. Refresh your dashboard in a moment.', 'PAYMENT_IN_PROGRESS');
    }

    let record;
    try {
      [record] = await generateFirebaseAccessKeys({
        plan,
        count: 1,
        assignedEmail: email,
        note: `Website purchase (${paymentId})`,
        createdBy: 'website_purchase',
      });
    } catch (error) {
      // Never leave a paid order locked without a key: release so the buyer's retry can issue one.
      logger.error('MYRA website purchase key issuance failed', { paymentId, detail: (error as Error)?.message });
      await releasePaymentLock(paymentId).catch(() => {});
      throw ApiError.internal('Payment received but the key could not be created. Try again — you will not be charged again.', 'KEY_ISSUE_FAILED');
    }
    // The key exists now; remembering it on the lock is best-effort (the lock must stay either way,
    // otherwise a retry would mint a second key).
    await recordKeyForPayment(paymentId, record.key).catch((error) =>
      logger.error('Could not record key on payment lock', { paymentId, detail: (error as Error)?.message })
    );
    try {
      await connectMongo();
      await creditReferralCommission({
        referralCode: body.referral_code,
        buyerEmail: email,
        paymentId,
        amount: planConfig.price,
      });
    } catch (error) {
      logger.error('MYRA website purchase referral credit failed', { detail: (error as Error)?.message });
    }

    return success({ key: record.key, plan, plan_price: planConfig.price }, 'Access key issued.');
  },
  { rateLimit: { scope: 'myra-website-purchase-verify', max: 20 } }
);
