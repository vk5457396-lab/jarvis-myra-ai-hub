export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { requireString } from '../../_lib/utils/validation';
import { publicDevice, upsertMyraDevice } from '../../_lib/services/myraService';
import { MyraDevice } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'POST', 'DELETE']);

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const devices = await MyraDevice.find({ userId: user._id }).sort({ lastLogin: -1 });
  return success({ devices: devices.map(publicDevice) });
});

export const POST = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const body = await req.json();
  const device = await upsertMyraDevice(user._id, body);
  return success({ device: publicDevice(device) }, 'Device updated.');
});

export const DELETE = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const deviceId = requireString(
    new URL(req.url).searchParams.get('device_id'),
    'device_id',
    { min: 4, max: 256 }
  );
  await MyraDevice.deleteOne({ userId: user._id, deviceId });
  return success({}, 'Device removed.');
});
