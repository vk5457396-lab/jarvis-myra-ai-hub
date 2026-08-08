import { ApiError } from '../../utils/response';
import logger from '../../utils/logger';

/** Endpoints per Google's current OAuth 2.0 / OpenID Connect documentation. Stable for years. */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

function clientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw ApiError.internal('Google connector is not configured.', 'GOOGLE_CONNECTOR_NOT_CONFIGURED');
  }
  return { clientId, clientSecret };
}

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = clientCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    logger.error('Google token exchange failed', { status: response.status });
    throw ApiError.internal('Could not complete Google sign-in.', 'GOOGLE_TOKEN_EXCHANGE_FAILED');
  }
  return response.json();
}

export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = clientCredentials();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    logger.error('Google token refresh failed', { status: response.status });
    throw ApiError.unauthorized('Google connection expired. Please reconnect.', 'GOOGLE_REAUTH_REQUIRED');
  }
  return response.json();
}

/** Best-effort - the local record is deleted regardless of whether Google's revoke call succeeds. */
export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
  } catch (error) {
    logger.error('Google token revoke failed', { detail: (error as Error)?.message });
  }
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{ sub: string; email: string }> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw ApiError.internal('Could not read the connected Google account.', 'GOOGLE_USERINFO_FAILED');
  }
  const payload = await response.json();
  return { sub: payload.sub, email: payload.email };
}
