export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import logger from '../../_lib/utils/logger';

export const OPTIONS = handleOptions(['POST']);

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

/** Replaces the `create-razorpay-order` Supabase Edge Function — same request/response shape. */
export const POST = withApi(
  async (req) => {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    try {
      const { product_id, customer_name, customer_email, customer_phone, is_international } = await req.json();

      if (!product_id) throw new Error('Product ID is required');

      const product = PRODUCT_PRICES[product_id];
      if (!product) throw new Error('Invalid product');
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error('Payments are not configured.');

      const amount =
        is_international && INTERNATIONAL_PRICES[product_id] ? INTERNATIONAL_PRICES[product_id] : product.price;

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

      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Razorpay API error', { detail: errorText });
        throw new Error('Payment initialization failed. Please try again.');
      }

      const order = await response.json();

      return NextResponse.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        product_name: product.name,
        display_amount: amount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  },
  { rateLimit: { scope: 'payments-create-order', max: 30 } }
);
