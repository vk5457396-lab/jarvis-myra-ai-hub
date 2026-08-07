export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import { MyraDevice } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const body = await req.json();
  const deviceId = requireString(body.device_id, 'device_id', { min: 4, max: 256 });

  await MyraDevice.updateOne(
    { userId: user._id, deviceId },
    { $set: { refreshTokenHash: null, isCurrentDevice: false } }
  );
  return success({}, 'Logged out.');
});
