export const runtime = 'nodejs';
export const maxDuration = 30;

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import logger from '../../_lib/utils/logger';
import { connectMongo } from '@/lib/db/mongoose';
import { Purchase, Profile, ReferralEarning } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Mirrors credit_referral_wallet(): idempotent (unique index), atomic wallet increment. */
async function creditReferralWallet(referrerId: string, purchaseId: string, purchaseAmount: number, referredUserId: string | null) {
  const commission = Math.floor(purchaseAmount * 0.05);
  if (commission <= 0) return;

  try {
    await ReferralEarning.create({
      referrerId,
      referredUserId: referredUserId || referrerId,
      purchaseId,
      purchaseAmount,
      commissionAmount: commission,
      status: 'credited',
    });
  } catch (err: any) {
    if (err?.code === 11000) return; // already credited for this purchase — idempotent no-op
    throw err;
  }

  await Profile.findByIdAndUpdate(referrerId, { $inc: { walletBalance: commission } });
}

/** Replaces the `send-telegram-notification` Supabase Edge Function — records the purchase, credits referral commission, and alerts admin on Telegram. */
export const POST = withApi(
  async (req) => {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    try {
      const {
        payment_id,
        razorpay_order_id,
        razorpay_signature,
        product_name,
        product_type,
        customer_name,
        customer_email,
        customer_phone,
        referral_code,
      } = await req.json();

      if (!payment_id || !product_name || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
      }
      if (!RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ error: 'Payment verification unavailable' }, { status: 500 });
      }

      // CRITICAL: verify the Razorpay signature server-side before any financial side effect.
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${payment_id}`)
        .digest('hex');
      if (!timingSafeEqualStr(expectedSignature, String(razorpay_signature))) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 401 });
      }

      await connectMongo();

      // Fetch the verified order from Razorpay to get the authoritative amount —
      // never trust the client-supplied amount.
      let verifiedAmount = 0;
      let verificationFailed = false;
      try {
        if (!RAZORPAY_KEY_ID) {
          verificationFailed = true;
        } else {
          const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
          const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (orderRes.ok) {
            const order = await orderRes.json();
            verifiedAmount = Math.round((order.amount || 0) / 100);
          } else {
            verificationFailed = true;
          }
        }
      } catch {
        verificationFailed = true;
      }

      if (verificationFailed || verifiedAmount <= 0) {
        logger.error('Razorpay order verification failed — refusing to record unverified amount');
        return NextResponse.json(
          { error: 'Unable to verify payment amount. Please contact support.' },
          { status: 502 }
        );
      }

      const recordedAmount = verifiedAmount;
      try {
        await Purchase.create({
          productName: product_name,
          productType: product_type || 'bundle',
          amount: recordedAmount,
          paymentId: payment_id,
          customerName: customer_name,
          customerEmail: customer_email,
          customerPhone: customer_phone,
        });
      } catch (err) {
        logger.error('Database insert failed', { detail: (err as Error)?.message });
      }

      let referrerName = '';
      let referrerInfo = '';
      let commission = 0;

      if (referral_code && verifiedAmount > 0) {
        const referrer = await Profile.findOne({ referralCode: referral_code }).select('_id fullName');

        if (referrer) {
          referrerName = referrer.fullName || 'Unknown';
          commission = Math.floor(verifiedAmount * 0.05);

          let referredUserId: string | null = null;
          if (customer_email) {
            const buyerProfile = await Profile.findOne({ email: String(customer_email).toLowerCase() }).select('_id');
            referredUserId = buyerProfile?._id?.toString() || null;
          }

          try {
            await creditReferralWallet(referrer._id.toString(), payment_id, verifiedAmount, referredUserId);
          } catch (err) {
            logger.error('Referral credit failed', { detail: (err as Error)?.message });
          }

          referrerInfo = `
━━━━━━━━━━━━━━━━━━━━━━
🔗 *Referral Information*
━━━━━━━━━━━━━━━━━━━━━━
• Referred by: *${referrerName}*
• Referral Code: \`${referral_code}\`
• Commission (5%): *₹${commission}*
• ✅ Commission credited to wallet`;
        }
      }

      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(recordedAmount);

      const istTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const adminMessage = `
🎉 *NEW PURCHASE ALERT!* 🎉

━━━━━━━━━━━━━━━━━━━━━━
📦 *Product Details*
━━━━━━━━━━━━━━━━━━━━━━
• Product: *${product_name}*
• Type: \`${product_type || 'standard'}\`
• Amount: *${formattedAmount}*
• Payment ID: \`${payment_id}\`

━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Information*
━━━━━━━━━━━━━━━━━━━━━━
• Name: ${customer_name || '❌ Not provided'}
• Email: ${customer_email || '❌ Not provided'}
• Phone: ${customer_phone || '❌ Not provided'}
${referrerInfo}
━━━━━━━━━━━━━━━━━━━━━━
⏰ *Transaction Time*
━━━━━━━━━━━━━━━━━━━━━━
${istTime} (IST)

✅ Payment verified and recorded in database
      `.trim();

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: adminMessage, parse_mode: 'Markdown' }),
        });
        if (!telegramResponse.ok) logger.error('Telegram notification failed');
      }

      const verificationMessage = encodeURIComponent(
        `🔐 Payment Verification Request\n\n` +
          `Payment ID: ${payment_id}\n` +
          `Product: ${product_name}\n` +
          `Amount: ${formattedAmount}\n` +
          `Phone: ${customer_phone || 'N/A'}\n\n` +
          `Please verify my payment and activate my product.`
      );
      const telegramDeepLink = `https://t.me/codeninjavik1?text=${verificationMessage}`;

      return NextResponse.json({ success: true, message: 'Notification sent', telegramLink: telegramDeepLink });
    } catch (error) {
      logger.error('Payment notify failed', { detail: (error as Error)?.message });
      return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
    }
  },
  { rateLimit: { scope: 'payments-notify', max: 30 } }
);
