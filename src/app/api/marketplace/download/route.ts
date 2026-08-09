export const runtime = 'nodejs';
export const maxDuration = 120;

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { toBlobApiError } from '../../_lib/utils/blobErrors';
import logger from '../../_lib/utils/logger';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct, MarketplaceDownload } from '@/lib/db/models';
import { auth } from '@/lib/auth/config';

export const OPTIONS = handleOptions(['POST']);

/**
 * Replaces the `marketplace-download` Supabase Edge Function. Verifies payment
 * (for paid products) then streams the file straight from Vercel Blob — no
 * signed-URL step, since private Blob reads must be server-mediated anyway.
 */
export const POST = withApi(
  async (req) => {
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    const body = await req.json();
    const { product_id, razorpay_payment_id, razorpay_order_id, razorpay_signature, customer_name, customer_email } =
      body;

    if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

    await connectMongo();
    const product = await MarketplaceProduct.findById(product_id).catch(() => null);
    if (!product || !product.isPublished) return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    if (!product.filePath && !product.externalDownloadUrl) {
      return NextResponse.json({ error: 'Download file is not available yet' }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    if (product.price > 0) {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ error: 'Payment verification details missing' }, { status: 400 });
      }
      const expected = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expected !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    const logDownload = async () => {
      try {
        await MarketplaceDownload.create({
          productId: product._id,
          userId,
          customerEmail: customer_email ?? null,
          customerName: customer_name ?? null,
          amount: product.price,
          paymentId: razorpay_payment_id ?? null,
          razorpayOrderId: razorpay_order_id ?? null,
        });
        await MarketplaceProduct.findByIdAndUpdate(product._id, { $inc: { downloadCount: 1 } });
      } catch (error) {
        logger.error('Download logging failed', { detail: (error as Error)?.message });
      }
    };

    // Externally-hosted file (MediaFire, Drive, Dropbox, ...) — nothing to
    // proxy, just hand the client the direct link. Keeps large files off our
    // own Blob storage/bandwidth entirely.
    if (product.externalDownloadUrl) {
      await logDownload();
      return NextResponse.json({
        success: true,
        external: true,
        url: product.externalDownloadUrl,
        filename: product.fileName || `${product.slug}.zip`,
      });
    }

    let result;
    try {
      result = await get(product.filePath, { access: 'private' });
    } catch (error) {
      logger.error('Blob fetch failed', { detail: (error as Error)?.message });
      const apiError = toBlobApiError(error);
      return NextResponse.json(
        { error: apiError.message, error_code: apiError.errorCode },
        { status: apiError.statusCode }
      );
    }
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'Download file is not available' }, { status: 404 });
    }

    await logDownload();

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${product.fileName || 'download'}"`,
      },
    });
  },
  { rateLimit: { scope: 'marketplace-download', max: 30 } }
);
