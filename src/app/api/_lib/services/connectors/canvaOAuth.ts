import { ApiError } from '../../utils/response';
import logger from '../../utils/logger';
import type { ProviderAdapter } from './types';

/** Endpoints per Canva Connect API's current documentation (canva.dev/docs/connect). */
const TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';
const REVOKE_URL = 'https://api.canva.com/rest/v1/oauth/revoke';
const USER_URL = 'https://api.canva.com/rest/v1/users/me';

interface CanvaTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  // Canva's OAuth token endpoint deliberately does NOT use the RFC 6749 error shape
  // (`error`/`error_description`) - it returns its REST API's own `code`/`message` shape
  // for every failure (400 invalid_grant/invalid_client/unsupported_grant_type, 401
  // invalid_client/unauthorized_user - see canva.dev/docs/connect/api-reference/
  // authentication/generate-access-token). Logging `error`/`error_description` here would
  // always log `undefined` for a real Canva failure.
  code?: string;
  message?: string;
}

function basicAuthHeader(): string {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw ApiError.internal('Canva connector is not configured.', 'CANVA_CONNECTOR_NOT_CONFIGURED');
  }
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

export const canvaAdapter: ProviderAdapter = {
  // Canva mandates PKCE (S256) - codeVerifier is required, per Canva's Connect API docs.
  async exchangeCode(code, codeVerifier, redirectUri) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuthHeader() },
      body,
    });
    const json: CanvaTokenResponse = await response.json();
    if (!response.ok || json.code || !json.access_token) {
      // Deliberately logs redirect_uri and client_id length (never the secret) alongside
      // Canva's real error. `code: "invalid_client"` here means the CANVA_CLIENT_ID/SECRET
      // pair doesn't match what's registered for the integration in the Canva Developer
      // Portal; `code: "invalid_grant"` on this step usually means redirect_uri isn't
      // registered for the integration, or the code/code_verifier round trip didn't match.
      logger.error('Canva token exchange failed', {
        status: response.status,
        code: json.code,
        message: json.message,
        redirect_uri: redirectUri,
        client_id_length: (process.env.CANVA_CLIENT_ID || '').length,
      });
      throw ApiError.internal('Could not complete Canva sign-in.', 'CANVA_TOKEN_EXCHANGE_FAILED');
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresInSeconds: json.expires_in,
      scope: json.scope,
    };
  },

  async refreshToken(refreshToken) {
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuthHeader() },
      body,
    });
    const json: CanvaTokenResponse = await response.json();
    if (!response.ok || json.code || !json.access_token) {
      logger.error('Canva token refresh failed', {
        status: response.status,
        code: json.code,
        message: json.message,
      });
      // code: "invalid_grant" here is expected/benign if two requests raced to refresh the
      // same single-use refresh token - connectorService.getValidAccessToken retries once
      // against whatever the winner of that race just persisted before giving up.
      throw ApiError.unauthorized('Canva connection expired. Please reconnect.', 'CANVA_REAUTH_REQUIRED');
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresInSeconds: json.expires_in,
      scope: json.scope,
    };
  },

  /** Best-effort - revoking a refresh token also invalidates its whole lineage of access tokens. */
  async revokeToken(token) {
    try {
      const response = await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuthHeader() },
        body: new URLSearchParams({ token }),
      });
      if (!response.ok) {
        const json: CanvaTokenResponse = await response.json().catch(() => ({}));
        logger.error('Canva token revoke failed', { status: response.status, code: json.code, message: json.message });
      }
    } catch (error) {
      logger.error('Canva token revoke failed', { detail: (error as Error)?.message });
    }
  },

  async fetchUserInfo(accessToken) {
    const response = await fetch(USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const json: CanvaTokenResponse = await response.json().catch(() => ({}));
      logger.error('Canva userinfo fetch failed', { status: response.status, code: json.code, message: json.message });
      throw ApiError.internal('Could not read the connected Canva account.', 'CANVA_USERINFO_FAILED');
    }
    const payload = await response.json();
    return { id: String(payload.team_user?.user_id ?? payload.user_id), label: payload.display_name };
  },
};
