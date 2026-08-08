import { ApiError } from '../../utils/response';
import logger from '../../utils/logger';
import type { ProviderAdapter } from './types';

/** Endpoints per GitHub's current OAuth Apps documentation. */
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_URL = 'https://api.github.com/user';

function clientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw ApiError.internal('GitHub connector is not configured.', 'GITHUB_CONNECTOR_NOT_CONFIGURED');
  }
  return { clientId, clientSecret };
}

interface GithubTokenResponse {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export const githubAdapter: ProviderAdapter = {
  // GitHub's classic OAuth Apps don't support PKCE - the token request just needs the code
  // + client credentials. codeVerifier/redirectUri are accepted for interface uniformity but
  // codeVerifier is unused here (usesPkce: false on this provider's config skips sending it).
  async exchangeCode(code, _codeVerifier, redirectUri) {
    const { clientId, clientSecret } = clientCredentials();
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });
    const json: GithubTokenResponse = await response.json();
    if (!response.ok || json.error || !json.access_token) {
      logger.error('GitHub token exchange failed', { status: response.status, detail: json.error });
      throw ApiError.internal('Could not complete GitHub sign-in.', 'GITHUB_TOKEN_EXCHANGE_FAILED');
    }
    // Classic OAuth App tokens don't expire and have no refresh_token - expiresInSeconds
    // stays undefined, which getValidAccessToken treats as "never expires".
    return { accessToken: json.access_token, scope: json.scope };
  },

  // No refreshToken() - intentionally omitted (see exchangeCode's comment above).

  async revokeToken(token) {
    try {
      const { clientId, clientSecret } = clientCredentials();
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      await fetch(`https://api.github.com/applications/${clientId}/grant`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ access_token: token }),
      });
    } catch (error) {
      logger.error('GitHub token revoke failed', { detail: (error as Error)?.message });
    }
  },

  async fetchUserInfo(accessToken) {
    const response = await fetch(USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) {
      throw ApiError.internal('Could not read the connected GitHub account.', 'GITHUB_USERINFO_FAILED');
    }
    const payload = await response.json();
    return { id: String(payload.id), label: payload.login };
  },
};
