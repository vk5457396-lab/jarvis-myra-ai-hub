import crypto from 'node:crypto';
import { ApiError } from '../utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { UserConnection, OAuthState } from '@/lib/db/models';
import {
  CONNECTOR_METADATA,
  getConnectorMetadata,
  getProviderConfig,
  listConnectorIds,
} from './connectors/registry';
import { encryptToken, decryptToken } from '../utils/tokenCrypto';
import {
  exchangeGoogleCode,
  refreshGoogleToken,
  revokeGoogleToken,
  fetchGoogleUserInfo,
} from './connectors/googleOAuth';

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
  if (!provider || !process.env[provider.clientIdEnv]) {
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

  const url = new URL(provider.authorizeUrl);
  url.searchParams.set('client_id', process.env[provider.clientIdEnv]!);
  url.searchParams.set('redirect_uri', callbackRedirectUri(connectorId));
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

  try {
    if (meta.provider === 'google') {
      const tokens = await exchangeGoogleCode(code, stateDoc.codeVerifier, callbackRedirectUri(connectorId));
      const info = await fetchGoogleUserInfo(tokens.access_token);

      const update: Record<string, unknown> = {
        provider: meta.provider,
        providerAccountId: info.sub,
        accountLabel: info.email,
        accessTokenEncrypted: encryptToken(tokens.access_token),
        scopes: tokens.scope.split(' ').filter(Boolean),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: 'connected',
      };
      // Google only returns a refresh_token on first consent unless prompt=consent forced
      // one - don't overwrite an existing stored one with nothing on a no-op reconnect.
      if (tokens.refresh_token) {
        update.refreshTokenEncrypted = encryptToken(tokens.refresh_token);
      }

      await UserConnection.findOneAndUpdate({ userId: stateDoc.userId, connectorId }, update, {
        upsert: true,
        setDefaultsOnInsert: true,
      });
      return { ok: true };
    }
    return { ok: false, reason: 'unsupported_provider' };
  } catch {
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
  if (meta?.provider === 'google') {
    const tokenToRevoke = conn.refreshTokenEncrypted
      ? decryptToken(conn.refreshTokenEncrypted)
      : decryptToken(conn.accessTokenEncrypted);
    await revokeGoogleToken(tokenToRevoke);
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

  const stillValid = !conn.expiresAt || conn.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return decryptToken(conn.accessTokenEncrypted);

  if (!conn.refreshTokenEncrypted) {
    conn.status = 'expired';
    await conn.save();
    throw ApiError.unauthorized('Connection expired. Please reconnect.', 'CONNECTOR_REAUTH_REQUIRED');
  }

  if (meta.provider === 'google') {
    try {
      const refreshed = await refreshGoogleToken(decryptToken(conn.refreshTokenEncrypted));
      conn.accessTokenEncrypted = encryptToken(refreshed.access_token);
      conn.expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      conn.status = 'connected';
      await conn.save();
      return refreshed.access_token;
    } catch (error) {
      conn.status = 'expired';
      await conn.save();
      throw error;
    }
  }
  throw ApiError.internal('Unsupported connector provider.', 'CONNECTOR_UNSUPPORTED');
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

  throw ApiError.badRequest('Unknown tool for this connector.', 'CONNECTOR_TOOL_NOT_FOUND');
}
