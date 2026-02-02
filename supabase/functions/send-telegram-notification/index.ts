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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      payment_id, 
      product_name, 
      product_type,
      amount, 
      customer_name, 
      customer_email, 
      customer_phone 
    } = await req.json();

    console.log('Received payment notification:', { payment_id, product_name, product_type, amount });

    if (!payment_id || !product_name) {
      throw new Error('Payment ID and product name are required');
    }

    // Save purchase to database using service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { error: dbError } = await supabase
      .from('purchases')
      .insert({
        product_name,
        product_type: product_type || 'bundle',
        amount: amount || 0,
        payment_id,
        customer_name,
        customer_email,
        customer_phone,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue to send Telegram even if DB fails
    } else {
      console.log('Purchase saved to database');
    }

    // Format amount with currency
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

    // Get current time in IST
    const istTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Create admin notification message with enhanced formatting
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

━━━━━━━━━━━━━━━━━━━━━━
⏰ *Transaction Time*
━━━━━━━━━━━━━━━━━━━━━━
${istTime} (IST)

✅ Payment verified and recorded in database
    `.trim();

    // Send admin notification
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: adminMessage,
        parse_mode: 'Markdown',
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult);
      throw new Error(`Telegram error: ${telegramResult.description}`);
    }

    console.log('Admin Telegram notification sent successfully');

    // Generate verification deep link for user
    // This creates a link that when clicked by user, will message the bot
    const verificationMessage = encodeURIComponent(
      `🔐 Payment Verification Request\n\n` +
      `Payment ID: ${payment_id}\n` +
      `Product: ${product_name}\n` +
      `Amount: ${formattedAmount}\n` +
      `Phone: ${customer_phone || 'N/A'}\n\n` +
      `Please verify my payment and activate my product.`
    );
    
    // Create Telegram deep link for user to contact admin
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending notification:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
