export interface ConnectorCapabilityMeta {
  id: string;
  /** Rendered as "• <label>" in the Android detail screen's permissions list. */
  label: string;
}

/** Static, provider-verified metadata for one connector the app can offer to connect. */
export interface ConnectorMetadata {
  id: string;
  /** Underlying OAuth identity provider (e.g. "google") - narrower than `id`, since one
   *  provider can back several connectorIds with different scope profiles. */
  provider: string;
  name: string;
  description: string;
  category: string;
  capabilities: ConnectorCapabilityMeta[];
  /** Exactly the OAuth scopes requested for this connectorId - must match what
   *  capabilities claims MYRA can do. Never broader than what's actually used. */
  scopes: string[];
}

export interface OAuthProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  usesPkce: boolean;
  /** Provider-specific query params always added to the authorize URL (e.g. Google's
   *  access_type=offline to request a refresh token) - kept out of the generic session
   *  builder so it stays provider-agnostic. */
  extraAuthorizeParams?: Record<string, string>;
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  /** undefined/null = token doesn't expire (e.g. classic GitHub OAuth App tokens). */
  expiresInSeconds?: number | null;
  scope?: string;
}

export interface ProviderUserInfo {
  /** Stable per-provider account id - stored as providerAccountId. */
  id: string;
  /** Human-readable label shown in the app ("Account: <label>") - email or username. */
  label: string;
}

/** One provider's token lifecycle, isolated behind a uniform interface so
 *  connectorService.ts never branches on `provider === 'x'` itself. */
export interface ProviderAdapter {
  exchangeCode(code: string, codeVerifier: string, redirectUri: string): Promise<TokenResult>;
  /** Omitted entirely for providers whose tokens don't expire/refresh (e.g. GitHub). */
  refreshToken?(refreshToken: string): Promise<TokenResult>;
  revokeToken(token: string): Promise<void>;
  fetchUserInfo(accessToken: string): Promise<ProviderUserInfo>;
}
