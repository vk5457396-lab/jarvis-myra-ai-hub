export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { optionalString, requireString, validateEnum } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['GET', 'POST', 'DELETE']);

/**
 * Disabled: server-side chat history storage/sync is turned off (the app keeps chat local-only
 * now). Handlers still authenticate and validate input, and keep the same response envelope as
 * before, so any caller still hitting these gets a normal 2xx instead of a 404/error - they just
 * no longer touch MyraChatHistory.
 */
export const GET = withApi(async (req) => {
  await requireMobileUser(req);
  return success({ messages: [] });
});

export const POST = withApi(
  async (req) => {
    await requireMobileUser(req);
    const body = await req.json();
    const role = validateEnum(body.role, 'role', ['user', 'assistant', 'system']);
    const message = requireString(body.message, 'message', { min: 1, max: 20000 });
    const conversationId = optionalString(body.conversation_id, 'conversation_id', 128) || 'default';
    const messageType = optionalString(body.message_type, 'message_type', 40) || 'text';
    const inputMode = optionalString(body.input_mode, 'input_mode', 40) || 'text';

    return success(
      {
        message: {
          id: 'disabled',
          conversation_id: conversationId,
          role,
          message,
          message_type: messageType,
          input_mode: inputMode,
          timestamp: new Date().toISOString(),
        },
      },
      'Message stored.',
      201
    );
  },
  { rateLimit: { scope: 'myra-chat-write', max: 240 } }
);

export const DELETE = withApi(async (req) => {
  await requireMobileUser(req);
  return success({ deleted: 0 }, 'Chat history cleared.');
});
