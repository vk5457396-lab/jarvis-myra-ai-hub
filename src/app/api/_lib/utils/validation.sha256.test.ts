// Run with: node --experimental-strip-types src/app/api/_lib/utils/validation.sha256.test.ts
//
// No test framework was wired up in this repo yet - added with zero new dependencies via
// Node's built-in test runner rather than pulling in Jest/Vitest for one validator. Exercises
// the actual validateSha256/optionalSha256 functions the admin panel PUT route calls, not a
// re-implementation of the regex, so it can't silently drift from the real behavior.

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSha256, optionalSha256 } from './validation';

// The real, GitHub-confirmed SHA-256 of the MYRA v2.1.43 release APK
// (vk5457396-lab/myra_apk, releases/download/v2.1.43/app-release.apk) - 64 hex characters.
// A previous message in this conversation mistyped this value missing its final "9"; that
// 63-character string was correctly rejected by validation, not a bug in it.
const REAL_APK_SHA256 = '6e048c90ef6d732858ae11d00ac7ecface571d4230cd48b084cebaa4454139b9';

test('accepts the exact real 64-character SHA-256', () => {
  assert.equal(REAL_APK_SHA256.length, 64);
  assert.equal(validateSha256(REAL_APK_SHA256), REAL_APK_SHA256);
});

test('trims leading/trailing whitespace without counting it toward length', () => {
  assert.equal(validateSha256(`  ${REAL_APK_SHA256}  `), REAL_APK_SHA256);
  assert.equal(validateSha256(`\n${REAL_APK_SHA256}\t`), REAL_APK_SHA256);
});

test('normalizes uppercase hex to lowercase', () => {
  assert.equal(validateSha256(REAL_APK_SHA256.toUpperCase()), REAL_APK_SHA256);
});

test('rejects a value missing one character (the exact bug reported)', () => {
  const missingLastChar = REAL_APK_SHA256.slice(0, -1);
  assert.equal(missingLastChar.length, 63);
  // Caught by requireString's length range check before validateSha256's own hex-format
  // regex ever runs - still a correct rejection, just a different (also correct) message.
  assert.throws(() => validateSha256(missingLastChar), /64 and 64 characters/);
});

test('rejects a value with one extra character', () => {
  assert.throws(() => validateSha256(`${REAL_APK_SHA256}a`), /64 and 64 characters/);
});

test('rejects a "sha256:" prefix rather than silently stripping it', () => {
  // Explicit per the requirements: no prefix support - the admin must paste the raw digest.
  assert.throws(() => validateSha256(`sha256:${REAL_APK_SHA256}`));
});

test('rejects non-hex characters', () => {
  const withNonHex = `g${REAL_APK_SHA256.slice(1)}`;
  assert.throws(() => validateSha256(withNonHex), /64 hexadecimal characters/);
});

test('optionalSha256 treats blank/whitespace-only input as "not provided", not invalid', () => {
  assert.equal(optionalSha256(undefined), null);
  assert.equal(optionalSha256(null), null);
  assert.equal(optionalSha256(''), null);
  assert.equal(optionalSha256('   '), null);
});

test('optionalSha256 still validates a value once one is actually provided', () => {
  assert.equal(optionalSha256(REAL_APK_SHA256), REAL_APK_SHA256);
  assert.throws(() => optionalSha256(REAL_APK_SHA256.slice(0, -1)));
});
