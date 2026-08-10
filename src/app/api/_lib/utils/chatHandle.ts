import { ApiError } from './response';

const HANDLE_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
// Handles that would be confusing or spoof a system contact if a real user claimed them.
const RESERVED_HANDLES = new Set(['myra', 'admin', 'support', 'system', 'root', 'moderator']);

export type HandleRejection = { available: false; reason: string };

/** Format-only validation (chars/length). Throws ApiError.badRequest on failure. */
export function requireValidHandle(value: unknown): string {
  const str = String(value ?? '').trim();
  if (!HANDLE_PATTERN.test(str)) {
    throw ApiError.badRequest(
      'Username must be 3-20 characters: letters, numbers, and underscores only.',
      'INVALID_USERNAME'
    );
  }
  return str;
}

/** Format + reserved-word check, without touching the database. Used by the availability check. */
export function checkHandleFormat(value: unknown): HandleRejection | null {
  const str = String(value ?? '').trim();
  if (!HANDLE_PATTERN.test(str)) {
    return { available: false, reason: 'Must be 3-20 characters: letters, numbers, underscores only.' };
  }
  if (RESERVED_HANDLES.has(str.toLowerCase())) {
    return { available: false, reason: 'This username is reserved.' };
  }
  return null;
}

export function isReservedHandle(lower: string): boolean {
  return RESERVED_HANDLES.has(lower);
}
