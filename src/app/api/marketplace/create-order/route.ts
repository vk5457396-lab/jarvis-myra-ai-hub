export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import logger from '../../_lib/utils/logger';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

/** Replaces the `marketplace-create-order` Supabase Edge Function — same request/response shape. */
export const POST = withApi(
  async (req) => {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    try {
      const { product_id, customer_name, customer_email, customer_phone } = await req.json();
      if (!product_id) throw new Error('product_id required');
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error('Payments are not configured.');

      await connectMongo();
      const product = await MarketplaceProduct.findById(product_id).catch(() => null);
      if (!product || !product.isPublished) throw new Error('Product not found');
      if (product.price <= 0) throw new Error('Product is free, no payment needed');

      const amount = product.price;
      const orderData = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `mkt_${product._id.toString().slice(0, 8)}_${Date.now()}`,
        notes: {
          product_id: product._id.toString(),
          product_name: product.title,
          customer_name: customer_name || '',
          customer_email: customer_email || '',
          customer_phone: customer_phone || '',
          server_price: String(amount),
        },
      };

      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        logger.error('Razorpay error', { detail: await response.text() });
        throw new Error('Payment initialization failed');
      }
      const order = await response.json();

      return NextResponse.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        product_name: product.title,
        display_amount: amount,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  },
  { rateLimit: { scope: 'marketplace-create-order', max: 30 } }
);
