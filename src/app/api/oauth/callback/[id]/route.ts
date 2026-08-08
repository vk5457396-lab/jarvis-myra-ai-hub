export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { handleOAuthCallback } from '../../../_lib/services/connectorService';

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

  if (providerError) {
    return redirectToApp(connectorId, 'error', providerError === 'access_denied' ? 'denied' : 'provider_error');
  }
  if (!code || !state) {
    return redirectToApp(connectorId, 'error', 'invalid_response');
  }

  const result = await handleOAuthCallback(connectorId, code, state);
  const failureReason = 'reason' in result ? result.reason : undefined;
  return redirectToApp(connectorId, result.ok ? 'success' : 'error', failureReason);
}
