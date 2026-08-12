export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEnum } from '../../../_lib/utils/validation';
import { MYRA_PLANS, discountedPrice } from '../../../_lib/services/myraService';
import { MyraProfile } from '@/lib/db/models';
import logger from '../../../_lib/utils/logger';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const plan = validateEnum(
      body.plan,
      'plan',
      ['basic', 'premium', 'elite', 'elite_pro', 'membership']
    );
    const planConfig = MYRA_PLANS[plan];
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw ApiError.internal('Payments are not configured.', 'PAYMENTS_NOT_CONFIGURED');
    }

    // Admin-set per-user coupon discount (setDiscountPercent) - read fresh here, never trusted
    // from the client, so the charged amount can't be tampered with from the app.
    const profile = await MyraProfile.findOne({ userId: user._id }).select('discountPercent');
    const discountPercent = profile?.discountPercent || 0;
    const finalPrice = discountedPrice(planConfig.price, discountPercent);

    const orderData = {
      amount: finalPrice * 100,
      currency: 'INR',
      receipt: `myra_${plan}_${Date.now()}`.slice(0, 40),
      notes: {
        type: 'myra_subscription',
        plan,
        user_id: user._id.toString(),
        email: user.email,
        discount_percent: String(discountPercent),
      },
      partial_payment: false,
    };
    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      logger.error('MYRA subscription order creation failed', { detail: await response.text() });
      throw ApiError.internal('Payment initialization failed.', 'PAYMENT_ORDER_FAILED');
    }

    const order = await response.json();
    return success({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan,
    });
  },
  { rateLimit: { scope: 'myra-subscription-order', max: 20 } }
);
