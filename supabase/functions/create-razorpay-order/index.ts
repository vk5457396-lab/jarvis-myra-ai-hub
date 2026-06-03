import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('Razorpay credentials not configured');
}

const PRODUCT_PRICES: Record<string, { price: number; name: string }> = {
  jarvis: { price: 899, name: 'Jarvis 2.0' },
  myra: { price: 899, name: 'MYRA 2.0' },
  myra_activation: { price: 799, name: 'MYRA 2.0 Activation Key (Lifetime)' },
  aria: { price: 899, name: 'ARIA 1.0' },
  bundle_jarvis_myra: { price: 1599, name: 'Jarvis 2.0 + MYRA 2.0 Bundle' },
  source_jarvis: { price: 3900, name: 'Jarvis 2.0 Source Code' },
  source_myra: { price: 3900, name: 'MYRA 2.0 Source Code' },
  source_aria: { price: 3900, name: 'ARIA 1.0 Source Code' },
  source_bundle: { price: 6999, name: 'Jarvis 2.0 + MYRA 2.0 Source Code Bundle' },
};

const INTERNATIONAL_PRICES: Record<string, number> = {
  jarvis: 1299,
  myra: 1299,
  myra_activation: 1155,
  aria: 1299,
  bundle_jarvis_myra: 2299,
  source_jarvis: 3499,
  source_myra: 3499,
  source_aria: 3499,
  source_bundle: 4999,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, customer_name, customer_email, customer_phone, is_international } = await req.json();

    if (!product_id) {
      throw new Error('Product ID is required');
    }

    const product = PRODUCT_PRICES[product_id];
    if (!product) {
      throw new Error('Invalid product');
    }

    const amount = is_international && INTERNATIONAL_PRICES[product_id]
      ? INTERNATIONAL_PRICES[product_id]
      : product.price;

    const orderData = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${product_id}_${Date.now()}`,
      notes: {
        product_id,
        product_name: product.name,
        customer_name: customer_name || '',
        customer_email: customer_email || '',
        customer_phone: customer_phone || '',
        server_price: String(amount),
      },
      partial_payment: false,
    };

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Payment initialization failed. Please try again.');
    }

    const order = await response.json();

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        product_name: product.name,
        display_amount: amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
