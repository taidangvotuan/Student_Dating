import { expect, it } from 'vitest';
import { createInitialState } from '../mocks/data';
import { interact } from './discovery';
import { markConversationRead, openNotification, sendMessage } from './chat';

it('sends a trimmed message only to the selected active conversation', () => {
  const state = interact(createInitialState(), 'an', 'THICH').state;
  const result = sendMessage(state, 'conversation-an', '  Xin chào An!  ');
  expect(result.conversations[0].messages.at(-1)?.body).toBe('Xin chào An!');
  expect(result.conversations[0].messages.at(-1)?.senderId).toBe(state.profile.id);
  expect(() => sendMessage(state, 'missing', 'hello')).toThrow();
  expect(() => sendMessage(state, 'conversation-an', '  ')).toThrow();
  expect(() => sendMessage(interact(state, 'an', 'CHAN').state, 'conversation-an', 'hello')).toThrow();
});
it('opening chat clears message unread count independently of notification read state', () => {
  const state = interact(createInitialState(), 'an', 'THICH').state;
  const read = markConversationRead(state, 'conversation-an');
  expect(read.conversations[0].unreadCount).toBe(0);
  expect(read.notifications[0].readAt).toBeNull();
});
it('opens notification to its exact conversation and marks only that notification read', () => {
  const state = interact(interact(createInitialState(), 'an', 'THICH').state, 'mai', 'THICH').state;
  const result = openNotification(state, 'notification-an');
  expect(result.conversationId).toBe('conversation-an');
  expect(result.state.notifications.find(item => item.id === 'notification-an')?.readAt).toBeTruthy();
  expect(result.state.notifications.find(item => item.id === 'notification-mai')?.readAt).toBeNull();
});
