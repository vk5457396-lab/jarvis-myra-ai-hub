import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';
import { dispatchNotification } from './notificationService';
import logger from '../utils/logger';

/** The one product flagged as the current official MYRA Android release. */
export async function getCurrentAppRelease() {
  await connectMongo();
  return MarketplaceProduct.findOne({ isAppRelease: true, isPublished: true }).lean();
}

/** Best-effort push to every registered device when a new app version goes live. */
export async function notifyNewAppRelease(product: any) {
  try {
    await dispatchNotification({
      title: `MYRA v${product.versionName} is available`,
      body: product.shortDescription || "Tap to see what's new and update.",
      notification_type: 'app_update',
      priority: 'high',
      target: 'all',
    });
  } catch (error) {
    logger.error('Failed to push app-update notification', { detail: (error as Error)?.message });
  }
}
