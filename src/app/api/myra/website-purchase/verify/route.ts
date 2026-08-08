export const runtime = 'nodejs';
export const maxDuration = 30;

import crypto from 'node:crypto';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString, validateEnum } from '../../../_lib/utils/validation';
import { auth } from '@/lib/auth/config';
import { MYRA_PLANS } from '../../../_lib/services/myraService';
import { generateMyraAccessKeys } from '../../../_lib/services/myraAdminService';
import logger from '../../../_lib/utils/logger';

export const OPTIONS = handleOptions(['POST']);

function validSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/** Verifies the Razorpay payment and issues a MYRA access key for the plan, assigned to the buyer's email. */
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
      order.amount_paid < expectedAmount ||
      order.notes?.type !== 'myra_website_purchase' ||
      order.notes?.plan !== plan ||
      order.notes?.email !== email
    ) {
      throw ApiError.badRequest('Payment details do not match the selected plan.', 'PAYMENT_MISMATCH');
    }

    try {
      const [record] = await generateMyraAccessKeys({
        plan,
        count: 1,
        assignedEmail: email,
        note: `Website purchase (${paymentId})`,
        createdBy: 'website_purchase',
        paymentId,
      });
      return success({ key: record.key, plan, plan_price: planConfig.price }, 'Access key issued.');
    } catch (error: any) {
      if (error?.code === 11000) {
        throw ApiError.conflict('This payment has already been used to issue a key.', 'PAYMENT_ALREADY_USED');
      }
      throw error;
    }
  },
  { rateLimit: { scope: 'myra-website-purchase-verify', max: 20 } }
);
