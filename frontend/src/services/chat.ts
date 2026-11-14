import type { DemoState } from "./models";

export function sendMessage(
  state: DemoState,
  conversationId: string,
  text: string,
): DemoState {
  const conversation = state.conversations.find(
    (item) => item.id === conversationId,
  );
  const body = text.trim();
  if (!conversation?.active)
    throw new Error(
      "Hội thoại không còn hoạt động. Bạn không thể gửi tin nhắn.",
    );
  if (!body || body.length > 2000)
    throw new Error("Tin nhắn cần từ 1 đến 2.000 ký tự.");
  const message = {
    id: crypto.randomUUID(),
    senderId: state.profile.id,
    body,
    sentAt: new Date().toISOString(),
  };
  return {
    ...state,
    conversations: state.conversations.map((item) =>
      item.id === conversationId
        ? { ...item, messages: [...item.messages, message] }
        : item,
    ),
  };
}
export function markConversationRead(
  state: DemoState,
  conversationId: string,
): DemoState {
  return {
    ...state,
    conversations: state.conversations.map((item) =>
      item.id === conversationId ? { ...item, unreadCount: 0 } : item,
    ),
  };
}
export function openNotification(
  state: DemoState,
  id: string,
): { state: DemoState; conversationId?: string } {
  const notification = state.notifications.find((item) => item.id === id);
  if (!notification) return { state };
  return {
    state: {
      ...state,
      notifications: state.notifications.map((item) =>
        item.id === id
          ? { ...item, readAt: item.readAt || new Date().toISOString() }
          : item,
      ),
    },
    conversationId: notification.conversationId,
  };
}
export function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
export function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
