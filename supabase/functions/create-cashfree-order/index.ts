import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');

// Use production URL for live transactions
const CASHFREE_API_URL = 'https://api.cashfree.com/pg/orders';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, product_name, customer_name, customer_email, customer_phone } = await req.json();

    console.log('Creating Cashfree order for:', { product_name, amount, customer_name, customer_email });

    if (!amount || !product_name) {
      throw new Error('Amount and product name are required');
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error('Cashfree credentials not configured');
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || 'customer@example.com',
        customer_phone: customer_phone || '9999999999',
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/thank-you?product=${encodeURIComponent(product_name)}&order_id=${orderId}`,
        notify_url: null,
      },
      order_note: product_name,
    };

    const response = await fetch(CASHFREE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', errorText);
      throw new Error(`Cashfree API error: ${errorText}`);
    }

    const order = await response.json();
    console.log('Cashfree order created:', order.order_id);

    return new Response(
      JSON.stringify({
        order_id: order.order_id,
        payment_session_id: order.payment_session_id,
        order_amount: order.order_amount,
        order_currency: order.order_currency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating Cashfree order:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
