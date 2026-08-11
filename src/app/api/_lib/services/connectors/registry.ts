import type { ConnectorMetadata, OAuthProviderConfig } from './types';

/**
 * Every connector the app currently offers. Adding a provider means adding one entry
 * here (+ an OAUTH_PROVIDERS entry for a new `provider`, + its exchange/refresh/revoke/
 * userinfo functions) - nothing else in the OAuth endpoints changes.
 *
 * "google" and "google_drive" are split into separate connectorIds (both backed by the
 * same `provider: "google"`) so a user can grant Calendar access without also granting
 * Drive access, and vice versa - each is its own consent screen, its own row, its own
 * disconnect. Scopes are deliberately minimal and match `capabilities` exactly (no scope
 * is requested that isn't backed by a real, currently-implemented tool):
 *  - Calendar uses `calendar.events.readonly` (events only, not calendar list/settings/ACLs).
 *  - Drive uses `drive.file` (only files the user opens/shares with MYRA), not the
 *    "restricted" `drive.readonly` scope, which would require Google's separate app
 *    security assessment before it could go live for real users.
 */
export const CONNECTOR_METADATA: Record<string, ConnectorMetadata> = {
  google: {
    id: 'google',
    provider: 'google',
    name: 'Google',
    description: 'Read your upcoming Google Calendar events.',
    category: 'productivity',
    capabilities: [{ id: 'calendar_read', label: 'Read your upcoming Calendar events' }],
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ],
  },
  google_drive: {
    id: 'google_drive',
    provider: 'google',
    name: 'Google Drive',
    description: "See files you've opened or shared with MYRA - not your whole Drive.",
    category: 'productivity',
    capabilities: [
      { id: 'drive_file_read', label: "List files you've opened or shared with MYRA" },
    ],
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'],
  },
  // Same Google OAuth app as google/google_drive above (GOOGLE_CLIENT_ID/SECRET) - no separate
  // client id needed, just another connectorId with its own narrower scope/consent. Read-only:
  // youtube.readonly is enough for search/list, no upload or channel-management capability
  // exists yet. Requires the YouTube Data API v3 to be enabled for this OAuth client's Google
  // Cloud project (console.cloud.google.com -> APIs & Services -> Library) - a one-time,
  // dashboard-only step outside what any client id/secret env var can express.
  youtube: {
    id: 'youtube',
    provider: 'google',
    name: 'YouTube',
    description: 'Search YouTube videos.',
    category: 'media',
    capabilities: [{ id: 'youtube_search', label: 'Search YouTube videos' }],
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/youtube.readonly'],
  },
  // GitHub classic OAuth Apps don't offer a clean read-only repo scope - `repo` is the
  // standard scope every GitHub integration requests for repository access (see
  // githubOAuth.ts's comment on why there's no refresh - tokens don't expire by default).
  github: {
    id: 'github',
    provider: 'github',
    name: 'GitHub',
    description: 'List your GitHub repositories.',
    category: 'productivity',
    capabilities: [{ id: 'repo_read', label: 'List your repositories' }],
    scopes: ['read:user', 'repo'],
  },
  // Canva mandates PKCE and per-capability scopes (asset:write doesn't imply asset:read,
  // etc.) - design:meta:read is the minimum for listing designs (canva.dev/docs/connect).
  canva: {
    id: 'canva',
    provider: 'canva',
    name: 'Canva',
    description: 'List your Canva designs.',
    category: 'creative',
    capabilities: [{ id: 'design_list', label: 'List your Canva designs' }],
    scopes: ['design:meta:read'],
  },
};

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    usesPkce: true,
    extraAuthorizeParams: {
      // offline -> Google issues a refresh_token; consent -> issues one on every connect,
      // not just the very first grant (otherwise a reconnect after a revoke returns none).
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    // Classic GitHub OAuth Apps don't support/require PKCE.
    usesPkce: false,
  },
  canva: {
    authorizeUrl: 'https://www.canva.com/api/oauth/authorize',
    tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
    revokeUrl: 'https://api.canva.com/rest/v1/oauth/revoke',
    clientIdEnv: 'CANVA_CLIENT_ID',
    clientSecretEnv: 'CANVA_CLIENT_SECRET',
    // Canva's Connect API mandates PKCE (S256) - see canva.dev/docs/connect/authentication.
    usesPkce: true,
  },
};

export function getConnectorMetadata(connectorId: string): ConnectorMetadata | null {
  return CONNECTOR_METADATA[connectorId] ?? null;
}

export function getProviderConfig(provider: string): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[provider] ?? null;
}

export function listConnectorIds(): string[] {
  return Object.keys(CONNECTOR_METADATA);
}
