export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import { optionalString } from '../../_lib/utils/validation';
import { ensureMyraState, publicSettings } from '../../_lib/services/myraService';
import { MyraSettings, Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PATCH']);

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const websiteProfile = await Profile.findOne({ email: user.email });
  const state = await ensureMyraState(user, websiteProfile);
  return success({ settings: publicSettings(state.settings) });
});

export const PATCH = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const body = await req.json();
  const set: Record<string, any> = {};
  const theme = optionalString(body.theme, 'theme', 40);
  if (theme !== null) set.theme = theme;
  if (typeof body.notifications === 'boolean') set.notifications = body.notifications;
  const language = optionalString(body.language, 'language', 20);
  if (language !== null) set.language = language;
  const voice = optionalString(body.assistant_voice, 'assistant_voice', 80);
  if (voice !== null) set.assistantVoice = voice;
  const wakeWord = optionalString(body.wake_word, 'wake_word', 80);
  if (wakeWord !== null) set.wakeWord = wakeWord;
  if (body.permissions && typeof body.permissions === 'object' && !Array.isArray(body.permissions)) {
    set.permissions = body.permissions;
  }

  const settings = await MyraSettings.findOneAndUpdate(
    { userId: user._id },
    { $set: set, $setOnInsert: { userId: user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return success({ settings: publicSettings(settings) }, 'Settings updated.');
});
