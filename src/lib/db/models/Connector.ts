import { Schema, model, models, type Model } from 'mongoose';

const objectId = Schema.Types.ObjectId;

/**
 * One user's OAuth grant to a third-party connector. `connectorId` is the app-facing id
 * (e.g. "google", "google_drive") - narrower than `provider` (the OAuth identity provider,
 * e.g. "google") so the same provider can back multiple scope profiles, each its own
 * consent/row per user (e.g. a user can connect "google" without granting Drive access).
 */
const userConnectionSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    connectorId: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    accountLabel: { type: String, default: null },
    accessTokenEncrypted: { type: String, required: true, select: false },
    refreshTokenEncrypted: { type: String, default: null, select: false },
    scopes: { type: [String], default: [] },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['connected', 'expired', 'revoked'], default: 'connected' },
  },
  { timestamps: true, collection: 'user_connections' }
);
userConnectionSchema.index({ userId: 1, connectorId: 1 }, { unique: true });

/**
 * Short-lived server-side record of one in-flight OAuth authorize attempt - holds the PKCE
 * code_verifier and which user/connector started it, so /api/oauth/callback/[id] validates
 * `state` server-side instead of trusting anything the browser round-trips. The TTL index
 * auto-deletes abandoned attempts; a used state is deleted immediately on success (one-time use).
 */
const oauthStateSchema = new Schema(
  {
    state: { type: String, required: true, unique: true },
    userId: { type: objectId, ref: 'User', required: true },
    connectorId: { type: String, required: true },
    codeVerifier: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'oauth_states' }
);
oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserConnection: Model<any> =
  models.UserConnection || model('UserConnection', userConnectionSchema);
export const OAuthState: Model<any> =
  models.OAuthState || model('OAuthState', oauthStateSchema);
