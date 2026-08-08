export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEnum } from '../../../_lib/utils/validation';
import { auth } from '@/lib/auth/config';
import { MYRA_PLANS } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/**
 * Website-triggered purchase of a MYRA plan. Mirrors /api/myra/subscription/order
 * (the Android in-app purchase) but the buyer doesn't need the app installed yet —
 * payment success (see ./verify) issues an access key on their dashboard instead
 * of activating a mobile session directly.
 */
export const POST = withApi(
  async (req) => {
    const session = await auth();
    if (!session?.user?.email) throw ApiError.unauthorized('Login required.', 'AUTH_REQUIRED');

    const body = await req.json();
    const plan = validateEnum(body.plan, 'plan', ['basic', 'premium', 'elite', 'elite_pro', 'membership']);
    const planConfig = MYRA_PLANS[plan];

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw ApiError.internal('Payments are not configured.', 'PAYMENTS_NOT_CONFIGURED');
    }

    const orderData = {
      amount: planConfig.price * 100,
      currency: 'INR',
      receipt: `myra_web_${plan}_${Date.now()}`.slice(0, 40),
      notes: {
        type: 'myra_website_purchase',
        plan,
        email: session.user.email.toLowerCase(),
      },
      partial_payment: false,
    };
    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      throw ApiError.internal('Payment initialization failed.', 'PAYMENT_ORDER_FAILED');
    }

    const order = await response.json();
    return success({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan,
      plan_price: planConfig.price,
    });
  },
  { rateLimit: { scope: 'myra-website-purchase-order', max: 20 } }
);
