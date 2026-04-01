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
      customer_phone,
      referral_code,
    } = await req.json();

    console.log('Received payment notification:', { payment_id, product_name, product_type, amount, referral_code });

    if (!payment_id || !product_name) {
      throw new Error('Payment ID and product name are required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Save purchase to database
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
    } else {
      console.log('Purchase saved to database');
    }

    // Process referral commission if referral_code exists
    let referrerName = '';
    let referrerInfo = '';
    if (referral_code) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, full_name, referral_code')
        .eq('referral_code', referral_code)
        .maybeSingle();
      
      if (referrer) {
        referrerName = referrer.full_name || 'Unknown';
        const commission = Math.floor((amount || 0) * 0.05);
        
        // Find the referred user by email
        let referredUserId: string | null = null;
        if (customer_email) {
          const { data: referredProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customer_email)
            .maybeSingle();
          referredUserId = referredProfile?.id || null;
        }

        // Credit 5% commission to referrer's wallet
        if (commission > 0) {
          // Insert referral earning record
          const { error: earnError } = await supabase
            .from('referral_earnings')
            .insert({
              referrer_id: referrer.id,
              referred_user_id: referredUserId || referrer.id,
              purchase_id: payment_id,
              purchase_amount: amount || 0,
              commission_amount: commission,
            });

          if (earnError) {
            console.error('Error inserting referral earning:', earnError);
          } else {
            // Update referrer wallet balance
            const { error: walletError } = await supabase
              .from('profiles')
              .update({ wallet_balance: supabase.rpc ? undefined : 0 })
              .eq('id', referrer.id);
            
            // Use raw SQL update for atomic increment
            const { error: rpcError } = await supabase.rpc('process_referral_commission', {
              p_user_id: referredUserId || referrer.id,
              p_purchase_id: payment_id,
              p_purchase_amount: amount || 0,
            });
            
            // If RPC fails (e.g., user not referred), manually credit
            if (rpcError) {
              console.log('RPC commission failed (user may not be referred), manually crediting:', rpcError.message);
              // Directly update wallet
              const { data: currentProfile } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', referrer.id)
                .single();
              
              if (currentProfile) {
                await supabase
                  .from('profiles')
                  .update({ wallet_balance: currentProfile.wallet_balance + commission, updated_at: new Date().toISOString() })
                  .eq('id', referrer.id);
              }
            }
            
            console.log(`Commission of ₹${commission} credited to referrer ${referrer.id}`);
          }
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
    }).format(amount);

    const istTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
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

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult);
      throw new Error(`Telegram error: ${telegramResult.description}`);
    }

    console.log('Admin Telegram notification sent successfully');

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
