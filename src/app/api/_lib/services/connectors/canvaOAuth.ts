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
  error?: string;
  error_description?: string;
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
    if (!response.ok || json.error || !json.access_token) {
      logger.error('Canva token exchange failed', { status: response.status, detail: json.error });
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
    if (!response.ok || json.error || !json.access_token) {
      logger.error('Canva token refresh failed', { status: response.status, detail: json.error });
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
      await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuthHeader() },
        body: new URLSearchParams({ token }),
      });
    } catch (error) {
      logger.error('Canva token revoke failed', { detail: (error as Error)?.message });
    }
  },

  async fetchUserInfo(accessToken) {
    const response = await fetch(USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw ApiError.internal('Could not read the connected Canva account.', 'CANVA_USERINFO_FAILED');
    }
    const payload = await response.json();
    return { id: String(payload.team_user?.user_id ?? payload.user_id), label: payload.display_name };
  },
};
