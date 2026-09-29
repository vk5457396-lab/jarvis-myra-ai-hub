export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import logger from '../../_lib/utils/logger';
import { PRODUCT_PRICES, INTERNATIONAL_PRICES } from '@/lib/pricing';

export const OPTIONS = handleOptions(['POST']);

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
