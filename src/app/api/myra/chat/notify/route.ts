export const runtime = 'nodejs';
export const maxDuration = 20;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { requireString, optionalString } from '../../../_lib/utils/validation';
import { sendToTokens } from '../../../_lib/utils/fcm';
import { getConversationRecipients } from '../../../_lib/services/myraGroupService';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraDevice, MyraProfile, MyraSettings } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

// Client-triggered rather than a Firestore Cloud Function trigger: keeps the whole chat
// backend inside the existing Vercel/Next.js API surface with no extra infra to deploy or
// operate. The sender identity comes from the authenticated session, not the request body,
// so a client can only ever trigger a notification for a message it's actually sending.
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const conversationId = requireString(body.conversation_id, 'conversation_id', { min: 1, max: 200 });
    const preview = optionalString(body.preview, 'preview', 200) || 'New message';

    const recipientIds = await getConversationRecipients(conversationId, user._id.toString());
    if (!recipientIds.length) return success({ sent: 0 });

    await connectMongo();
    const [senderProfile, recipientSettings, devices] = await Promise.all([
      MyraProfile.findOne({ userId: user._id }).select('chatHandle username avatar'),
      MyraSettings.find({ userId: { $in: recipientIds } }).select('userId chatNotifications'),
      MyraDevice.find({ pushToken: { $ne: null }, userId: { $in: recipientIds } }).select(
        'deviceId pushToken userId'
      ),
    ]);

    // A recipient with no MyraSettings doc yet has never explicitly opted out - default to on.
    const optedOutIds = new Set(
      recipientSettings.filter((s) => s.chatNotifications === false).map((s) => s.userId.toString())
    );
    const eligibleRecipients = recipientIds.filter((id) => !optedOutIds.has(id));
    if (!eligibleRecipients.length) return success({ sent: 0 });

    const eligibleSet = new Set(eligibleRecipients);
    const targets = devices
      .filter((d) => eligibleSet.has(d.userId?.toString()))
      .map((d) => ({ device_id: d.deviceId, fcm_token: d.pushToken, user_id: d.userId?.toString() ?? null }));

    if (!targets.length) return success({ sent: 0 });

    const senderName = senderProfile?.chatHandle || senderProfile?.username || 'Someone';
    const outcome = await sendToTokens(targets, {
      title: senderName,
      body: preview,
      action: 'OPEN_USER_CHAT',
      notification_type: 'chat_message',
      conversation_id: conversationId,
      sender_username: senderName,
      sender_avatar: senderProfile?.avatar || '',
    });

    return success({ sent: outcome.successCount });
  },
  { rateLimit: { scope: 'myra-chat-notify', max: 120 } }
);
