export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { optionalString, requireString } from '../../_lib/utils/validation';
import { MyraMemory } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PUT', 'DELETE']);

function publicMemory(doc: any) {
  return {
    id: doc._id.toString(),
    key: doc.key,
    value: doc.value,
    source: doc.source,
    updated_at: doc.updatedAt,
  };
}

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const docs = await MyraMemory.find({ userId: user._id }).sort({ updatedAt: -1 }).lean();
  return success({ memories: docs.map(publicMemory) });
});

export const PUT = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const key = requireString(body.key, 'key', { min: 1, max: 256 });
    if (body.value === undefined || body.value === null) {
      throw new Error('value is required');
    }
    const source = optionalString(body.source, 'source', 40) || 'android';
    const doc = await MyraMemory.findOneAndUpdate(
      { userId: user._id, key },
      {
        $set: { value: body.value, source, updatedAt: new Date() },
        $setOnInsert: { userId: user._id, key },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return success({ memory: publicMemory(doc) }, 'Memory stored.');
  },
  { rateLimit: { scope: 'myra-memory-write', max: 120 } }
);

export const DELETE = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const key = requireString(new URL(req.url).searchParams.get('key'), 'key', { min: 1, max: 256 });
  await MyraMemory.deleteOne({ userId: user._id, key });
  return success({}, 'Memory deleted.');
});
