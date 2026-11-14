import { candidates } from '../mocks/data';
import { ageAt, type Conversation, type DemoState } from './models';

export function discover(state: DemoState) {
  const p = state.profile.preferences;
  return candidates.filter(item => !state.interactions[item.id]
    && ageAt(item.birthDate) >= p.minAge && ageAt(item.birthDate) <= p.maxAge
    && (!p.preferredGender || item.gender === p.preferredGender)
    && (!p.preferredFaculty || item.faculty === p.preferredFaculty)
    && (!p.verifiedOnly || item.verified));
}

// Demo adapter only. Real likes return an acknowledgement; matching arrives later
// through matching.match.created, followed by refreshing GET /api/chat.
export function interact(state: DemoState, targetId: string, kind: 'THICH' | 'BO_QUA' | 'CHAN'): { state: DemoState; match?: Conversation } {
  const person = candidates.find(item => item.id === targetId);
  if (!person || state.interactions[targetId] === 'CHAN') return { state };
  const next: DemoState = { ...state, interactions: { ...state.interactions, [targetId]: kind } };
  if (kind === 'CHAN') {
    next.conversations = state.conversations.map(item => item.participantId === targetId ? { ...item, active: false } : item);
  }
  if (kind === 'THICH' && person.likedMe && !state.conversations.some(item => item.participantId === targetId)) {
    const now = new Date().toISOString();
    const match: Conversation = {
      id: `conversation-${targetId}`, matchId: `match-${targetId}`, participantId: targetId, active: true, unreadCount: 1,
      messages: [{ id: `hello-${targetId}`, senderId: targetId, body: `Chào bạn! Rất vui vì chúng mình đã kết nối. Bạn có thích đi cà phê cuối tuần không?`, sentAt: now }],
    };
    next.conversations = [match, ...state.conversations];
    next.notifications = [{ id: `notification-${targetId}`, actorId: targetId, matchId: match.matchId, conversationId: match.id, readAt: null, createdAt: now }, ...state.notifications];
    return { state: next, match };
  }
  return { state: next };
}
