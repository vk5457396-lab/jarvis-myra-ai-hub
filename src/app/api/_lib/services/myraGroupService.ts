import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseApp } from '../utils/firebaseAdmin';

/** Fixed id so every user's login lands on the same one shared group doc. */
export const MYRA_GROUP_ID = 'myra-group';

/**
 * Every account gets auto-joined to one shared "MYRA Community" group on login/bootstrap.
 * Runs via the Admin SDK (not the client), which is the only way to add someone to a
 * conversation's `participants` array - firestore.rules deliberately blocks clients from
 * touching that field on update, so group membership can only ever be granted server-side.
 */
export async function ensureMyraGroupMembership(
  uid: string,
  username: string,
  avatar: string | null
) {
  const db = getFirestore(getFirebaseApp());
  const ref = db.collection('conversations').doc(MYRA_GROUP_ID);
  const snap = await ref.get();

  const participantUpdate: Record<string, unknown> = {
    participants: FieldValue.arrayUnion(uid),
    [`participantInfo.${uid}`]: { username, avatar: avatar || null },
  };

  if (!snap.exists) {
    await ref.set({
      type: 'group',
      groupName: 'MYRA Community',
      groupAvatar: null,
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      lastMessage: '',
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSenderId: '',
      ...participantUpdate,
    });
  } else {
    await ref.set(participantUpdate, { merge: true });
  }
}

/** All uids in a conversation except the sender - used to target push notifications. */
export async function getConversationRecipients(
  conversationId: string,
  excludeUid: string
): Promise<string[]> {
  const db = getFirestore(getFirebaseApp());
  const snap = await db.collection('conversations').doc(conversationId).get();
  if (!snap.exists) return [];
  const participants = (snap.data()?.participants as string[] | undefined) || [];
  return participants.filter((uid) => uid !== excludeUid);
}
