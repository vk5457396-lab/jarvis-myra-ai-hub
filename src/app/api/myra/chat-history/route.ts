export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { optionalString, requireString, validateEnum } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['GET', 'POST', 'DELETE']);

/**
 * Disabled: server-side chat history storage/sync is turned off (the app keeps chat local-only
 * now). No Mongo access at all here on purpose - old installs still hitting this endpoint would
 * otherwise cost a real DB read (auth lookup) and write (rate-limit bucket) per request even
 * though nothing is actually stored. Handlers stay auth-free and DB-free, just echoing a
 * same-shaped 2xx so any caller still hitting these keeps working with zero backend cost.
 */
export const GET = withApi(async () => {
  return success({ messages: [] });
});

export const POST = withApi(async (req) => {
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
});

export const DELETE = withApi(async () => {
  return success({ deleted: 0 }, 'Chat history cleared.');
});
