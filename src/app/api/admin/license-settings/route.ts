export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { validatePositiveInt, requireString } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { LicenseSettings, LICENSE_SETTINGS_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PUT']);

function toPublic(doc: any) {
  return {
    prefix: doc.prefix,
    random_length: doc.randomLength,
    max_activations: doc.maxActivations,
    device_lock: doc.deviceLock,
    offline_activation: doc.offlineActivation,
  };
}

export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();
  const doc =
    (await LicenseSettings.findById(LICENSE_SETTINGS_ID)) ||
    (await LicenseSettings.create({ _id: LICENSE_SETTINGS_ID }));
  return success(toPublic(doc));
});

export const PUT = withApi(
  async (req) => {
    await requireAdmin(req);

    const body = await req.json();
    const prefix = requireString(body.prefix, 'prefix', { min: 1, max: 16 }).toUpperCase();
    const randomLength = Math.max(8, Math.min(32, validatePositiveInt(body.random_length, 'random_length', 32)));
    const maxActivations = validatePositiveInt(body.max_activations, 'max_activations', 100);
    const deviceLock = Boolean(body.device_lock);
    const offlineActivation = Boolean(body.offline_activation);

    await connectMongo();
    const doc = await LicenseSettings.findByIdAndUpdate(
      LICENSE_SETTINGS_ID,
      { $set: { prefix, randomLength, maxActivations, deviceLock, offlineActivation } },
      { new: true, upsert: true }
    );

    return success(toPublic(doc), 'Settings saved.');
  },
  { rateLimit: { scope: 'admin-license-settings', max: 30 } }
);
