import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ApiError } from './response';

const ISSUER = 'codeninjavik-auth';
const AUDIENCE = 'myra-android';
const WEB_HANDOFF_AUDIENCE = 'myra-android-auth-handoff';
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const WEB_HANDOFF_TTL_SECONDS = 2 * 60;

export type MobileAccessClaims = {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  type: 'access';
  iat: number;
  exp: number;
};

export type MobileRefreshClaims = {
  sub: string;
  device_id: string;
  type: 'refresh';
  iat: number;
  exp: number;
};

export type MobileWebHandoffClaims = {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  type: 'web_handoff';
  iat: number;
  exp: number;
};

function authSecret(): string {
  const value = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) {
    throw ApiError.internal('Backend authentication is not configured.', 'AUTH_NOT_CONFIGURED');
  }
  return value;
}

export function signMobileTokenPair({
  userId,
  email,
  role,
  deviceId,
}: {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  deviceId: string;
}) {
  const accessToken = jwt.sign(
    { email, role, type: 'access' },
    authSecret(),
    {
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: userId,
      expiresIn: ACCESS_TTL_SECONDS,
      jwtid: crypto.randomUUID(),
    }
  );
  const refreshToken = jwt.sign(
    { device_id: deviceId, type: 'refresh' },
    authSecret(),
    {
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: userId,
      expiresIn: REFRESH_TTL_SECONDS,
      jwtid: crypto.randomUUID(),
    }
  );

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: ACCESS_TTL_SECONDS,
    refreshExpiresIn: REFRESH_TTL_SECONDS,
  };
}

export function signMobileWebHandoffToken({
  userId,
  email,
  role,
}: {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}) {
  return jwt.sign(
    { email, role, type: 'web_handoff' },
    authSecret(),
    {
      issuer: ISSUER,
      audience: WEB_HANDOFF_AUDIENCE,
      subject: userId,
      expiresIn: WEB_HANDOFF_TTL_SECONDS,
      jwtid: crypto.randomUUID(),
    }
  );
}

function verifyToken<T>(token: string, expectedType: string): T {
  try {
    const payload = jwt.verify(token, authSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as jwt.JwtPayload;
    if (payload.type !== expectedType || !payload.sub) {
      throw ApiError.unauthorized('Invalid authentication token.', 'INVALID_TOKEN');
    }
    return payload as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Authentication token expired.', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid authentication token.', 'INVALID_TOKEN');
  }
}

export function verifyMobileAccessToken(token: string): MobileAccessClaims {
  return verifyToken<MobileAccessClaims>(token, 'access');
}

export function verifyMobileRefreshToken(token: string): MobileRefreshClaims {
  return verifyToken<MobileRefreshClaims>(token, 'refresh');
}

export function verifyMobileWebHandoffToken(token: string): MobileWebHandoffClaims {
  try {
    const payload = jwt.verify(token, authSecret(), {
      issuer: ISSUER,
      audience: WEB_HANDOFF_AUDIENCE,
    }) as jwt.JwtPayload;
    if (payload.type !== 'web_handoff' || !payload.sub || !payload.email) {
      throw ApiError.unauthorized('Invalid authentication handoff.', 'INVALID_WEB_HANDOFF');
    }
    return payload as MobileWebHandoffClaims;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Authentication handoff expired.', 'WEB_HANDOFF_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid authentication handoff.', 'INVALID_WEB_HANDOFF');
  }
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenMatches(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashRefreshToken(token));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
