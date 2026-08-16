export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../_lib/utils/response';
import { logAutomationError } from '../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/**
 * App -> backend automation-failure report for Admin > Diagnostics. This does no failure
 * detection of its own - it's called from the exact points the app already detects one of these
 * (Agent hitting max steps, a tool reporting an error, a "playing"/"done" claim that turned out
 * to be a false positive) so that failure is visible somewhere other than a local logcat line
 * only reachable with the phone in hand.
 */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    try {
      await logAutomationError(user._id, body.device_id || null, body);
      return success({}, 'Logged.');
    } catch (e) {
      throw ApiError.badRequest(e instanceof Error ? e.message : 'Invalid error report.', 'INVALID_ERROR_REPORT');
    }
  },
  { rateLimit: { scope: 'myra-automation-error', max: 60 } }
);
