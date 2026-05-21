import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

// HMAC-SHA256 hex digest using Web Crypto
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      payment_id,
      razorpay_order_id,
      razorpay_signature,
      product_name,
      product_type,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      referral_code,
    } = await req.json();

    if (!payment_id || !product_name || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Payment verification unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: verify the Razorpay signature server-side before any financial side effect.
    const expectedSignature = await hmacSha256Hex(
      RAZORPAY_KEY_SECRET,
      `${razorpay_order_id}|${payment_id}`
    );
    if (!timingSafeEqual(expectedSignature, String(razorpay_signature))) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch the verified order from Razorpay to get the authoritative amount.
    // This prevents a caller from claiming a larger purchase amount than what was actually paid.
    let verifiedAmount = 0;
    let verificationFailed = false;
    try {
      const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
      if (!RAZORPAY_KEY_ID) {
        verificationFailed = true;
      } else {
        const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
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
      console.error('Razorpay order verification failed - refusing to record unverified amount');
      return new Response(
        JSON.stringify({ error: 'Unable to verify payment amount. Please contact support.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only the server-verified amount is recorded; client-supplied `amount` is never trusted.
    const recordedAmount = verifiedAmount;
    const { error: dbError } = await supabase
      .from('purchases')
      .insert({
        product_name,
        product_type: product_type || 'bundle',
        amount: recordedAmount,
        payment_id,
        customer_name,
        customer_email,
        customer_phone,
      });

    if (dbError) {
      console.error('Database insert failed');
    }

    // Process referral commission only with the verified amount
    let referrerName = '';
    let referrerInfo = '';
    let commission = 0;

    if (referral_code && verifiedAmount > 0) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('referral_code', referral_code)
        .maybeSingle();

      if (referrer) {
        referrerName = referrer.full_name || 'Unknown';
        commission = Math.floor(verifiedAmount * 0.05);

        let referredUserId: string | null = null;
        if (customer_email) {
          const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customer_email)
            .maybeSingle();
          referredUserId = buyerProfile?.id || null;
        }

        const { error: creditError } = await supabase.rpc('credit_referral_wallet', {
          p_referrer_id: referrer.id,
          p_purchase_id: payment_id,
          p_purchase_amount: verifiedAmount,
          p_referred_user_id: referredUserId,
        });

        if (creditError) {
          console.error('Referral credit failed');
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

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: adminMessage,
        parse_mode: 'Markdown',
      }),
    });

    if (!telegramResponse.ok) {
      console.error('Telegram notification failed');
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent',
        telegramLink: telegramDeepLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Notification failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
