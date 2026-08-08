export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { handleOAuthCallback } from '../../../_lib/services/connectorService';
import logger from '../../../_lib/utils/logger';

/**
 * Public - the provider's OAuth server redirects the user's browser here directly, with no
 * Authorization header. Never logs `code`/`state` (both are one-time-use secrets). Always
 * finishes by redirecting into the app via myra://oauth/{id}, never by rendering tokens,
 * codes, or raw provider errors.
 */
function redirectToApp(connectorId: string, status: 'success' | 'error', reason?: string): Response {
  const location = `myra://oauth/${connectorId}?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export async function GET(req: NextRequest) {
  const connectorId = req.nextUrl.pathname.split('/').pop() || '';
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const providerError = req.nextUrl.searchParams.get('error');
  const providerErrorDescription = req.nextUrl.searchParams.get('error_description');

  if (providerError) {
    // The provider (e.g. Canva) redirected back with an error instead of a code - most
    // commonly invalid_client/unauthorized_client (client id or redirect_uri isn't what's
    // registered for this app) or access_denied (user declined). Logged in full here since
    // this is the one place that ever sees the provider's real error string - the deep
    // link back to the app only ever gets a generic reason code, never this detail.
    logger.error('OAuth authorize redirected back with a provider error', {
      connectorId,
      error: providerError,
      error_description: providerErrorDescription,
    });
    return redirectToApp(connectorId, 'error', providerError === 'access_denied' ? 'denied' : 'provider_error');
  }
  if (!code || !state) {
    return redirectToApp(connectorId, 'error', 'invalid_response');
  }

  const result = await handleOAuthCallback(connectorId, code, state);
  const failureReason = 'reason' in result ? result.reason : undefined;
  return redirectToApp(connectorId, result.ok ? 'success' : 'error', failureReason);
}
