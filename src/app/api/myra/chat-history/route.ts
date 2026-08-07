export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { optionalString, requireString, validateEnum } from '../../_lib/utils/validation';
import { MyraChatHistory } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'POST', 'DELETE']);

function publicMessage(doc: any) {
  return {
    id: doc._id.toString(),
    conversation_id: doc.conversationId,
    role: doc.role,
    message: doc.message,
    message_type: doc.messageType,
    input_mode: doc.inputMode,
    timestamp: doc.timestamp,
  };
}

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversation_id');
  const rawLimit = Number(url.searchParams.get('limit') || 100);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100;
  const query: Record<string, any> = { userId: user._id };
  if (conversationId) query.conversationId = conversationId;

  const docs = await MyraChatHistory.find(query).sort({ timestamp: -1 }).limit(limit).lean();
  return success({ messages: docs.reverse().map(publicMessage) });
});

export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const role = validateEnum(body.role, 'role', ['user', 'assistant', 'system']);
    const message = requireString(body.message, 'message', { min: 1, max: 20000 });
    const conversationId = optionalString(body.conversation_id, 'conversation_id', 128) || 'default';
    const messageType = optionalString(body.message_type, 'message_type', 40) || 'text';
    const inputMode = optionalString(body.input_mode, 'input_mode', 40) || 'text';

    const doc = await MyraChatHistory.create({
      userId: user._id,
      conversationId,
      role,
      message,
      messageType,
      inputMode,
      timestamp: new Date(),
    });
    return success({ message: publicMessage(doc) }, 'Message stored.', 201);
  },
  { rateLimit: { scope: 'myra-chat-write', max: 240 } }
);

export const DELETE = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const conversationId = new URL(req.url).searchParams.get('conversation_id');
  const query: Record<string, any> = { userId: user._id };
  if (conversationId) query.conversationId = conversationId;
  const result = await MyraChatHistory.deleteMany(query);
  return success({ deleted: result.deletedCount }, 'Chat history cleared.');
});
