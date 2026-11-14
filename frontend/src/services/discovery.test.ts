import { expect, it } from 'vitest';
import { candidates, createInitialState } from '../mocks/data';
import { discover, interact } from './discovery';

it('advances after a one-sided like without creating a match', () => {
  const result = interact(createInitialState(), 'linh', 'THICH');
  expect(result.state.conversations).toHaveLength(0);
  expect(discover(result.state)[0].id).toBe('an');
  expect(result.match).toBeUndefined();
});
it('creates exactly one conversation and deep-linked notification on mutual like', () => {
  const result = interact(createInitialState(), 'an', 'THICH');
  expect(result.match?.participantId).toBe('an');
  expect(result.state.notifications[0].conversationId).toBe(result.match?.id);
  expect(interact(result.state, 'an', 'THICH').state.conversations).toHaveLength(1);
});
it('filters age, gender, faculty and verification and excludes interacted profiles', () => {
  const state = createInitialState();
  state.profile.preferences = { minAge: 18, maxAge: 100, preferredGender: 'Nữ', preferredFaculty: 'Thiết kế', verifiedOnly: true };
  expect(discover(state).map(item => item.id)).toEqual(['an']);
  expect(discover(interact(state, 'an', 'BO_QUA').state)).toEqual([]);
});
it('keeps blocked profiles excluded and deactivates a matched conversation', () => {
  const matched = interact(createInitialState(), 'an', 'THICH').state;
  const blocked = interact(matched, 'an', 'CHAN').state;
  expect(blocked.conversations[0].active).toBe(false);
  expect(discover(blocked).some(item => item.id === 'an')).toBe(false);
  expect(interact(blocked, 'an', 'THICH').state).toEqual(blocked);
  expect(candidates).toHaveLength(4);
});
