import { getFirestore, FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { getFirebaseApp } from '../utils/firebaseAdmin';
import { generateKey } from '@/lib/licenses';
import { MYRA_PLANS } from './myraService';
import { ApiError } from '../utils/response';

/**
 * Firestore-backed MYRA access keys - generated here (Admin SDK, bypasses firestore.rules) and
 * redeemed directly by the Android app against the SAME collection (see LicenseRepository.kt +
 * the app's firestore.rules `myra_access_keys` match block). There is deliberately no HTTP
 * endpoint the app calls to redeem a key: app and website are tied together only by sharing this
 * Firebase project, never a live backend connection.
 */
const COLLECTION = 'myra_access_keys';

/**
 * Which app a key was generated for - cosmetic/bookkeeping only. Both apps redeem from this
 * SAME collection by raw key string (see LicenseRepository.kt / AccessKeyManager.kt), so a key's
 * prefix or `app` field never gates which app can redeem it - either app will happily claim any
 * key here. This exists purely so the admin panel can label/filter keys by intended product,
 * since a single key still can't be simultaneously "active" in both apps: MYRA and LIA are
 * separately signed, so they compute different device ids for the same physical phone (see
 * DeviceManager.kt's doc comment and resetFirebaseAccessKeyDevice below) - a key redeemed in one
 * app shows as "already active on a different phone" in the other until its device lock is reset.
 */
export type KeyApp = 'myra' | 'lia';
const KEY_PREFIXES: Record<KeyApp, string> = { myra: 'MYRA', lia: 'LIA' };

type KeyStatus = 'available' | 'redeemed' | 'disabled';

interface AccessKeyDoc {
  key: string;
  app: KeyApp;
  plan: string;
  durationDays: number | null;
  status: KeyStatus;
  note: string | null;
  assignedEmail: string | null;
  redeemedByDeviceId: string | null;
  redeemedAt: Timestamp | null;
  createdBy: string | null;
  createdAt: Timestamp | null;
}

function db() {
  return getFirestore(getFirebaseApp());
}

function toPublic(data: AccessKeyDoc) {
  return {
    id: data.key,
    key: data.key,
    app: data.app ?? 'myra', // legacy docs predate this field - they were all MYRA at the time
    plan: data.plan,
    credits: MYRA_PLANS[data.plan]?.credits ?? null,
    duration_days: data.durationDays,
    status: data.status,
    redeemed_by: data.redeemedByDeviceId,
    redeemed_at: data.redeemedAt ? data.redeemedAt.toDate().toISOString() : null,
    assigned_email: data.assignedEmail,
    note: data.note,
    created_by: data.createdBy,
    created_at: data.createdAt ? data.createdAt.toDate().toISOString() : null,
  };
}

/** Random key space is huge (33^16), so a collision is practically impossible - `.create()`
 *  still guards it atomically (throws ALREADY_EXISTS instead of silently overwriting) rather
 *  than trusting probability alone. */
async function createUniqueKeyDoc(payload: Omit<AccessKeyDoc, 'key' | 'createdAt'>): Promise<AccessKeyDoc> {
  const col = db().collection(COLLECTION);
  for (let attempt = 0; attempt < 8; attempt++) {
    const key = generateKey(KEY_PREFIXES[payload.app], 16);
    const ref = col.doc(key);
    try {
      await ref.create({ ...payload, key, createdAt: FieldValue.serverTimestamp() });
      const snap = await ref.get();
      return snap.data() as AccessKeyDoc;
    } catch (err) {
      const code = (err as { code?: number | string })?.code;
      if (code === 6 || code === 'already-exists' || /ALREADY_EXISTS/i.test(String(err))) continue;
      throw err;
    }
  }
  throw ApiError.internal('Could not generate a unique access key, try again.', 'KEY_GENERATION_FAILED');
}

export async function generateFirebaseAccessKeys({
  app,
  plan,
  count,
  durationDays,
  note,
  assignedEmail,
  createdBy,
}: {
  app?: KeyApp;
  plan: string;
  count: number;
  durationDays?: number | null;
  note?: string | null;
  assignedEmail?: string | null;
  createdBy?: string | null;
}) {
  const resolvedApp: KeyApp = app === 'lia' ? 'lia' : 'myra';
  if (!MYRA_PLANS[plan]) {
    throw ApiError.badRequest(`plan must be one of: ${Object.keys(MYRA_PLANS).join(', ')}.`, 'INVALID_PLAN');
  }
  const normalizedEmail = assignedEmail ? assignedEmail.trim().toLowerCase() : null;
  if (normalizedEmail && count > 1) {
    throw ApiError.badRequest('An email-assigned key can only be generated one at a time.', 'INVALID_COUNT');
  }
  const resolvedDuration =
    durationDays !== undefined && durationDays !== null ? durationDays : MYRA_PLANS[plan].durationDays;

  const docs: AccessKeyDoc[] = [];
  for (let i = 0; i < count; i++) {
    docs.push(
      await createUniqueKeyDoc({
        app: resolvedApp,
        plan,
        durationDays: resolvedDuration,
        status: 'available',
        note: note || null,
        assignedEmail: normalizedEmail,
        redeemedByDeviceId: null,
        redeemedAt: null,
        createdBy: createdBy || null,
      })
    );
  }
  return docs.map(toPublic);
}

export async function listFirebaseAccessKeys(limit = 500) {
  const snap = await db().collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => toPublic(d.data() as AccessKeyDoc));
}

/** Direct O(1) doc lookup by the exact key string - the admin panel's "search by key" box uses
 *  this instead of scanning listFirebaseAccessKeys' (capped at 500, newest-first) results, so an
 *  older key is still found instantly. Returns null (not a throw) when the key doesn't exist, so
 *  the caller can render "no key found" instead of an error. */
export async function getFirebaseAccessKeyByKey(key: string) {
  const ref = db().collection(COLLECTION).doc(key.trim().toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) return null;
  return toPublic(snap.data() as AccessKeyDoc);
}

/**
 * Admin-only block/unblock - runs with the Admin SDK so it isn't subject to firestore.rules at
 * all, which is what lets it do the one thing the app's own redeem transition can't: touch a key
 * that's already 'redeemed'. Blocking a redeemed key is exactly the case that matters most (a
 * device that already activated needs to actually lose access, not just be unable to redeem
 * something it never will again) - see LicenseRepository.checkRemoteStatus() on the app side,
 * which re-reads this same doc and force-logs the device back out to LicenseActivity's hard gate
 * the next time it checks (see LicenseLiveGate).
 *
 * Unblocking restores whatever the key's status was before the block, rather than resetting
 * blanket to 'available': a key a device had already redeemed must go back to 'redeemed' (that
 * SAME device regains access, via redeemedByDeviceId - never handed to a fresh device), while a
 * never-redeemed key goes back to 'available'.
 */
export async function setFirebaseAccessKeyStatus(key: string, status: 'available' | 'disabled') {
  const ref = db().collection(COLLECTION).doc(key.trim().toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) throw ApiError.notFound('Access key not found.', 'ACCESS_KEY_NOT_FOUND');
  const data = snap.data() as AccessKeyDoc;

  const nextStatus =
    status === 'disabled'
      ? 'disabled'
      : data.redeemedByDeviceId
        ? 'redeemed'
        : 'available';

  await ref.update({ status: nextStatus });
  const updated = await ref.get();
  return toPublic(updated.data() as AccessKeyDoc);
}

/**
 * Clears a key's device lock entirely (redeemedByDeviceId + redeemedAt) and forces it back to
 * 'available' - deliberately NOT the same as setFirebaseAccessKeyStatus's block/unblock, whose
 * "unblock" restores 'redeemed' (same device gets its access back) whenever a device is already
 * bound. That's the wrong move when the bound device id itself is stale/wrong rather than the
 * key being legitimately blocked - e.g. the Android app's signing key changed, which changes its
 * stored device identity even on the exact same physical phone (see DeviceManager.kt's own doc).
 * This is for exactly that case: the key becomes freshly redeemable by whichever device enters
 * it next, same as a never-redeemed key.
 */
export async function resetFirebaseAccessKeyDevice(key: string) {
  const ref = db().collection(COLLECTION).doc(key.trim().toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) throw ApiError.notFound('Access key not found.', 'ACCESS_KEY_NOT_FOUND');
  await ref.update({
    status: 'available',
    redeemedByDeviceId: null,
    redeemedAt: null,
  });
  const updated = await ref.get();
  return toPublic(updated.data() as AccessKeyDoc);
}

/** This user's own keys (website-purchase dashboard + the /download paywall check) - a plain
 *  Admin SDK query, so it's NOT subject to firestore.rules' `allow list: if false` (that only
 *  restricts the client SDK the Android app uses). */
export async function listFirebaseAccessKeysForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const snap = await db().collection(COLLECTION).where('assignedEmail', '==', normalized).get();
  const docs = snap.docs.map((d) => d.data() as AccessKeyDoc);
  docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  return docs.map(toPublic);
}

/**
 * Idempotency guard for payment webhooks/verify calls that can legitimately be retried
 * (network retry, double form-submit) - Firestore has no equivalent of Mongo's unique index, so
 * this uses `.create()` on a doc keyed by the Razorpay payment id as an atomic
 * "has this payment already issued a key" lock. Returns false (caller should treat this as
 * "already handled, don't issue a second key") if the lock already existed.
 */
export async function claimPaymentOnce(paymentId: string): Promise<boolean> {
  try {
    await db()
      .collection('myra_payment_locks')
      .doc(paymentId)
      .create({ paymentId, claimedAt: FieldValue.serverTimestamp() });
    return true;
  } catch (err) {
    const code = (err as { code?: number | string })?.code;
    if (code === 6 || code === 'already-exists' || /ALREADY_EXISTS/i.test(String(err))) return false;
    throw err;
  }
}
