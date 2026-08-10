export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../_lib/utils/response';
import { requireValidHandle, isReservedHandle } from '../../_lib/utils/chatHandle';
import { publicMyraProfile } from '../../_lib/services/myraService';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

// Handles both first-time setup and later changes - same operation either way, so one
// endpoint covers what the client screens call "set" and "change".
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const value = requireValidHandle(body.username);
    const lower = value.toLowerCase();

    if (isReservedHandle(lower)) {
      throw ApiError.conflict('This username is reserved.', 'USERNAME_RESERVED');
    }

    await connectMongo();
    try {
      const profile = await MyraProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { chatHandle: value, chatHandleLower: lower } },
        { new: true }
      );
      if (!profile) throw ApiError.notFound('MYRA profile not found.', 'MYRA_PROFILE_NOT_FOUND');
      return success({ profile: publicMyraProfile(profile) }, 'Username updated.');
    } catch (error: any) {
      // Unique index race: someone else claimed this handle between the availability
      // check and this write.
      if (error?.code === 11000) {
        throw ApiError.conflict('This username is already taken.', 'USERNAME_TAKEN');
      }
      throw error;
    }
  },
  { rateLimit: { scope: 'myra-username-set', max: 20 } }
);
