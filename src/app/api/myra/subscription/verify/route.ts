export const runtime = 'nodejs';
export const maxDuration = 30;

import crypto from 'node:crypto';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString, validateEnum } from '../../../_lib/utils/validation';
import {
  expiryForPlan,
  MYRA_PLANS,
  discountedPrice,
  publicMyraProfile,
  publicSubscription,
} from '../../../_lib/services/myraService';
import { MyraProfile, MyraSubscription, MyraUsage } from '@/lib/db/models';
import logger from '../../../_lib/utils/logger';

export const OPTIONS = handleOptions(['POST']);

function validSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const plan = validateEnum(
      body.plan,
      'plan',
      ['basic', 'premium', 'elite', 'elite_pro', 'membership']
    );
    const orderId = requireString(body.order_id, 'order_id', { min: 5, max: 128 });
    const paymentId = requireString(body.payment_id, 'payment_id', { min: 5, max: 128 });
    const signature = requireString(body.signature, 'signature', { min: 20, max: 512 });
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw ApiError.internal('Payments are not configured.', 'PAYMENTS_NOT_CONFIGURED');
    }
    if (!validSignature(orderId, paymentId, signature, keySecret)) {
      throw ApiError.unauthorized('Invalid payment signature.', 'INVALID_PAYMENT_SIGNATURE');
    }

    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${authorization}` },
    });
    if (!orderResponse.ok) {
      logger.error('MYRA subscription order verification failed', {
        detail: await orderResponse.text(),
      });
      throw ApiError.internal('Payment could not be verified.', 'PAYMENT_VERIFICATION_FAILED');
    }
    const order = await orderResponse.json();
    const planConfig = MYRA_PLANS[plan];
    // Trusts the discount % Razorpay itself stored in the order's notes at creation time (order/
    // route.ts) rather than re-reading the user's CURRENT discount - that's what was actually
    // charged, and an admin could have changed the discount in between order creation and this
    // verify call. notes come back from Razorpay's own API, so the client can't forge them.
    const orderDiscountPercent = Number(order.notes?.discount_percent) || 0;
    const expectedAmount = discountedPrice(planConfig.price, orderDiscountPercent) * 100;
    if (
      order.id !== orderId ||
      order.amount !== expectedAmount ||
      order.amount_paid < expectedAmount ||
      order.notes?.type !== 'myra_subscription' ||
      order.notes?.plan !== plan ||
      order.notes?.user_id !== user._id.toString()
    ) {
      throw ApiError.badRequest('Payment details do not match the selected plan.', 'PAYMENT_MISMATCH');
    }

    const paymentOwner = await MyraSubscription.findOne({
      paymentId,
      userId: { $ne: user._id },
    }).select('_id');
    if (paymentOwner) {
      throw ApiError.conflict('Payment has already been used.', 'PAYMENT_ALREADY_USED');
    }

    const previousSubscription = await MyraSubscription.findOne({ userId: user._id }).select('plan');
    const isFirstPaidSubscription = !previousSubscription || previousSubscription.plan === 'free';

    const startDate = new Date();
    const expiryDate = expiryForPlan(plan, startDate);
    const [subscription, profile] = await Promise.all([
      MyraSubscription.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            plan,
            startDate,
            expiryDate,
            paymentId,
            orderId,
            status: 'active',
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ),
      MyraProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            credits: planConfig.credits ?? 0,
            subscriptionType: plan,
            subscriptionStatus: 'active',
            subscriptionExpiry: expiryDate,
            premiumFeatures: planConfig.features,
          },
        },
        { new: true }
      ),
      MyraUsage.findOneAndUpdate(
        { userId: user._id },
        {
          $set: { creditsUsed: 0, lastReset: startDate },
          $setOnInsert: { userId: user._id },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);

    if (!profile) {
      throw ApiError.notFound('MYRA profile not found.', 'MYRA_PROFILE_NOT_FOUND');
    }

    // Referral payout: exactly one credit, exactly once, only for a genuinely first paid
    // subscription from a user who redeemed someone else's code before ever subscribing.
    // referralCredited flips true here so a plan change/renewal later never pays out again.
    if (isFirstPaidSubscription && profile.referredByCode && !profile.referralCredited) {
      const referrerUpdate = await MyraProfile.findOneAndUpdate(
        { referralCode: profile.referredByCode },
        { $inc: { credits: 1 } },
        { new: true }
      ).select('_id');
      if (referrerUpdate) {
        await MyraProfile.updateOne({ _id: profile._id }, { $set: { referralCredited: true } });
      }
    }

    return success(
      {
        subscription: publicSubscription(subscription),
        profile: publicMyraProfile(profile),
      },
      'Subscription activated.'
    );
  },
  { rateLimit: { scope: 'myra-subscription-verify', max: 20 } }
);
