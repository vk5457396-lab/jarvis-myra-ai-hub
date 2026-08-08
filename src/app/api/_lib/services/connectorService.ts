import crypto from 'node:crypto';
import { ApiError } from '../utils/response';
import logger from '../utils/logger';
import { connectMongo } from '@/lib/db/mongoose';
import { UserConnection, OAuthState } from '@/lib/db/models';
import {
  CONNECTOR_METADATA,
  getConnectorMetadata,
  getProviderConfig,
  listConnectorIds,
} from './connectors/registry';
import { encryptToken, decryptToken } from '../utils/tokenCrypto';
import { getProviderAdapter } from './connectors/adapters';

const STATE_TTL_MS = 10 * 60 * 1000;

function callbackRedirectUri(connectorId: string): string {
  const base = process.env.NEXTAUTH_URL || 'https://codeninjavik.in';
  return `${base.replace(/\/$/, '')}/api/oauth/callback/${connectorId}`;
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

/** Metadata for every known connector + this user's live status, for GET /api/connectors. */
export async function listConnectorsForUser(userId: string) {
  await connectMongo();
  const connections = await UserConnection.find({ userId }).lean();
  const byConnectorId = new Map(connections.map((c: any) => [c.connectorId, c]));

  return listConnectorIds().map((id) => {
    const meta = CONNECTOR_METADATA[id];
    const conn = byConnectorId.get(id);
    return {
      id: meta.id,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      capabilities: meta.capabilities,
      status: conn ? conn.status : 'not_connected',
      account: conn?.accountLabel ?? null,
      connected_at: conn?.createdAt ?? null,
    };
  });
}

/** Starts an OAuth attempt: stores PKCE verifier + state server-side, returns the authorize URL. */
export async function createConnectSession(userId: string, connectorId: string): Promise<string> {
  const meta = getConnectorMetadata(connectorId);
  if (!meta) throw ApiError.notFound('Unknown connector.', 'CONNECTOR_NOT_FOUND');
  const provider = getProviderConfig(meta.provider);
  const clientId = provider ? process.env[provider.clientIdEnv] : undefined;
  if (!provider || !clientId) {
    logger.error('OAuth connect blocked - client id env var missing at runtime', {
      connectorId,
      provider: meta.provider,
      expected_env_var: provider?.clientIdEnv ?? null,
    });
    throw ApiError.internal(`${meta.name} is not configured.`, 'CONNECTOR_NOT_CONFIGURED');
  }

  await connectMongo();
  const state = base64url(crypto.randomBytes(24));
  const { verifier, challenge } = pkcePair();

  await OAuthState.create({
    state,
    userId,
    connectorId,
    codeVerifier: verifier,
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  });

  const redirectUri = callbackRedirectUri(connectorId);
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', meta.scopes.join(' '));
  url.searchParams.set('state', state);
  if (provider.usesPkce) {
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  for (const [key, value] of Object.entries(provider.extraAuthorizeParams ?? {})) {
    url.searchParams.set(key, value);
  }

  // Never logs the client_id/secret values - only shapes useful for diagnosing a
  // provider-side "invalid_client"/redirect_uri mismatch (env var length, redirect_uri
  // actually sent) without putting a real credential in Vercel's log stream.
  logger.info('OAuth connect session created', {
    connectorId,
    provider: meta.provider,
    redirect_uri: redirectUri,
    client_id_length: clientId.length,
    uses_pkce: provider.usesPkce,
    scopes: meta.scopes,
  });

  return url.toString();
}

/** Validates `state`, exchanges the code for tokens, and upserts the encrypted connection.
 *  Never throws to the caller - errors become a { ok: false, reason } the callback route
 *  turns into a friendly deep-link redirect instead of a raw stack trace. */
export async function handleOAuthCallback(
  connectorId: string,
  code: string,
  state: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await connectMongo();

  // findOneAndDelete makes the state single-use even under a duplicate/replayed callback.
  const stateDoc = await OAuthState.findOneAndDelete({ state, connectorId });
  if (!stateDoc) return { ok: false, reason: 'invalid_state' };
  if (stateDoc.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' };

  const meta = getConnectorMetadata(connectorId);
  if (!meta) return { ok: false, reason: 'unknown_connector' };
  const adapter = getProviderAdapter(meta.provider);
  if (!adapter) return { ok: false, reason: 'unsupported_provider' };

  try {
    const tokens = await adapter.exchangeCode(code, stateDoc.codeVerifier, callbackRedirectUri(connectorId));
    const info = await adapter.fetchUserInfo(tokens.accessToken);

    const update: Record<string, unknown> = {
      provider: meta.provider,
      providerAccountId: info.id,
      accountLabel: info.label,
      accessTokenEncrypted: encryptToken(tokens.accessToken),
      scopes: (tokens.scope ?? '').split(' ').filter(Boolean),
      expiresAt: tokens.expiresInSeconds ? new Date(Date.now() + tokens.expiresInSeconds * 1000) : null,
      status: 'connected',
    };
    // Some providers (Google) only return a refresh_token on first consent - don't overwrite
    // an existing stored one with nothing on a no-op reconnect.
    if (tokens.refreshToken) {
      update.refreshTokenEncrypted = encryptToken(tokens.refreshToken);
    }

    await UserConnection.findOneAndUpdate({ userId: stateDoc.userId, connectorId }, update, {
      upsert: true,
      setDefaultsOnInsert: true,
    });
    return { ok: true };
  } catch (error) {
    // Adapters (e.g. canvaOAuth.ts) already log the provider's raw error response for their
    // own step; this catches anything else in the exchange (fetchUserInfo, DB write) so a
    // failure here is never silent in Vercel's logs, without ever logging the code/tokens.
    logger.error('OAuth callback exchange failed', {
      connectorId,
      provider: meta.provider,
      error_code: error instanceof ApiError ? error.errorCode : null,
      detail: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: 'exchange_failed' };
  }
}

export async function disconnectConnector(userId: string, connectorId: string): Promise<void> {
  await connectMongo();
  const conn = await UserConnection.findOne({ userId, connectorId }).select(
    '+accessTokenEncrypted +refreshTokenEncrypted'
  );
  if (!conn) return;

  const meta = getConnectorMetadata(connectorId);
  const adapter = meta ? getProviderAdapter(meta.provider) : null;
  if (adapter) {
    const tokenToRevoke = conn.refreshTokenEncrypted
      ? decryptToken(conn.refreshTokenEncrypted)
      : decryptToken(conn.accessTokenEncrypted);
    await adapter.revokeToken(tokenToRevoke);
  }
  await UserConnection.deleteOne({ _id: conn._id });
}

/** Returns a currently-valid access token, transparently refreshing (and persisting the
 *  refresh) if the stored one has expired. Used by executeConnectorTool - never exposed
 *  to the Android app directly. */
export async function getValidAccessToken(userId: string, connectorId: string): Promise<string> {
  await connectMongo();
  const conn = await UserConnection.findOne({ userId, connectorId }).select(
    '+accessTokenEncrypted +refreshTokenEncrypted'
  );
  if (!conn || conn.status === 'revoked') {
    throw ApiError.badRequest('Not connected. Please connect this account first.', 'CONNECTOR_NOT_CONNECTED');
  }
  const meta = getConnectorMetadata(connectorId);
  if (!meta) throw ApiError.notFound('Unknown connector.', 'CONNECTOR_NOT_FOUND');

  // No expiresAt at all means the provider's tokens don't expire (e.g. classic GitHub OAuth
  // App tokens) - always "still valid" until a real API call reports otherwise.
  const stillValid = !conn.expiresAt || conn.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return decryptToken(conn.accessTokenEncrypted);

  const adapter = getProviderAdapter(meta.provider);
  if (!conn.refreshTokenEncrypted || !adapter?.refreshToken) {
    conn.status = 'expired';
    await conn.save();
    throw ApiError.unauthorized('Connection expired. Please reconnect.', 'CONNECTOR_REAUTH_REQUIRED');
  }

  const refreshTokenUsed = conn.refreshTokenEncrypted;
  try {
    const refreshed = await adapter.refreshToken(decryptToken(refreshTokenUsed));
    conn.accessTokenEncrypted = encryptToken(refreshed.accessToken);
    conn.expiresAt = refreshed.expiresInSeconds ? new Date(Date.now() + refreshed.expiresInSeconds * 1000) : null;
    if (refreshed.refreshToken) {
      conn.refreshTokenEncrypted = encryptToken(refreshed.refreshToken);
    }
    conn.status = 'connected';
    await conn.save();
    return refreshed.accessToken;
  } catch (error) {
    // Providers like Canva issue single-use refresh tokens - two near-simultaneous calls to
    // this function (e.g. two connector tool calls in flight at once) can both read the same
    // refresh token before either writes back, so the loser's refresh legitimately fails
    // (invalid_grant) even though the connection is fine. Before declaring it dead, re-check
    // whether a concurrent call already won that race and stored a newer refresh token - if
    // so, use what it left behind instead of forcing the user to fully reconnect.
    const latest = await UserConnection.findById(conn._id).select('+accessTokenEncrypted +refreshTokenEncrypted');
    if (latest && latest.status === 'connected' && latest.refreshTokenEncrypted !== refreshTokenUsed) {
      logger.warn('Canva/OAuth refresh raced with a concurrent refresh - using the winner\'s token', {
        connectorId,
        provider: meta.provider,
      });
      return decryptToken(latest.accessTokenEncrypted);
    }

    conn.status = 'expired';
    await conn.save();
    throw error;
  }
}

/** Manual "Reconnect"/refresh nudge from the app - just forces the refresh path above. */
export async function manualRefresh(userId: string, connectorId: string): Promise<void> {
  await getValidAccessToken(userId, connectorId);
}

/** The small, per-connector tool set proving connectors aren't just login - each call gets
 *  a live, auto-refreshed access token and proxies straight to the provider's REST API. */
export async function executeConnectorTool(
  userId: string,
  connectorId: string,
  toolId: string
): Promise<Record<string, unknown>> {
  const accessToken = await getValidAccessToken(userId, connectorId);

  if (connectorId === 'google' && toolId === 'list_upcoming_events') {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', new Date().toISOString());
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw ApiError.internal('Could not read Google Calendar.', 'GOOGLE_CALENDAR_FAILED');
    const data = await res.json();
    const events = (data.items || []).map((e: any) => ({
      summary: e.summary || '(no title)',
      start: e.start?.dateTime || e.start?.date,
    }));
    return { events };
  }

  if (connectorId === 'google_drive' && toolId === 'list_recent_files') {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('orderBy', 'modifiedTime desc');
    url.searchParams.set('fields', 'files(id,name,modifiedTime,webViewLink)');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw ApiError.internal('Could not read Google Drive.', 'GOOGLE_DRIVE_FAILED');
    const data = await res.json();
    return { files: data.files || [] };
  }

  if (connectorId === 'github' && toolId === 'list_repositories') {
    const url = new URL('https://api.github.com/user/repos');
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('per_page', '5');
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw ApiError.internal('Could not read GitHub repositories.', 'GITHUB_REPOS_FAILED');
    const data = await res.json();
    const repositories = (data || []).map((r: any) => ({
      name: r.full_name,
      private: r.private,
      url: r.html_url,
      updated_at: r.updated_at,
    }));
    return { repositories };
  }

  if (connectorId === 'canva' && toolId === 'list_designs') {
    const url = new URL('https://api.canva.com/rest/v1/designs');
    url.searchParams.set('limit', '10');
    url.searchParams.set('sort_by', 'modified_descending');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw ApiError.internal('Could not read Canva designs.', 'CANVA_DESIGNS_FAILED');
    const data = await res.json();
    const designs = (data.items || []).map((d: any) => ({
      title: d.title || '(untitled)',
      url: d.urls?.edit_url,
      updated_at: d.updated_at,
    }));
    return { designs };
  }

  throw ApiError.badRequest('Unknown tool for this connector.', 'CONNECTOR_TOOL_NOT_FOUND');
}
