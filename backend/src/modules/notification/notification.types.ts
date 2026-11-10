import type { NotificationType, NotificationStatus } from '@prisma/client';

/**
 * Shared notification event representation.
 * Notice: Zero static text columns (title, body, etc. are omitted by design).
 */
export interface NotificationEventEntity {
  readonly id: string;
  readonly type: NotificationType;
  readonly actorId: string | null;
  readonly matchId: string | null;
  readonly conversationId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
}

/**
 * Per-recipient delivery receipt and inbox status.
 */
export interface NotificationRecipientEntity {
  readonly id: string;
  readonly notificationId: string;
  readonly recipientId: string;
  readonly status: NotificationStatus;
  readonly readAt: Date | null;
  readonly createdAt: Date;
}

/**
 * Shape returned to client when querying notification inbox.
 */
export interface NotificationInboxItem {
  readonly id: string; // notification_recipients.id
  readonly notificationId: string;
  readonly type: NotificationType;
  readonly status: NotificationStatus;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly references: {
    readonly matchId?: string;
    readonly conversationId?: string;
    readonly actorId?: string;
  };
  readonly actorProfile?: {
    readonly fullName: string;
  };
  readonly title: string;
  readonly body: string;
}

export interface NotificationPageResult {
  readonly items: readonly NotificationInboxItem[];
  readonly nextCursor?: string;
  readonly unreadCount: number;
}

export interface CreateNotificationInput {
  readonly type: NotificationType;
  readonly recipientIds: readonly string[];
  readonly actorId?: string;
  readonly matchId?: string;
  readonly conversationId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Dynamic message rendering dictionary.
 * Maps (NotificationType, actorName, locale) -> localized title & body
 * completely separated from persistent storage.
 */
export function formatNotificationText(
  type: NotificationType,
  actorName?: string,
  locale: 'vi' | 'en' = 'vi'
): { title: string; body: string } {
  if (locale === 'en') {
    switch (type) {
      case 'GHEP_DOI':
        return {
          title: 'New Match!',
          body: actorName
            ? `You and ${actorName} have matched. Say hello!`
            : 'You have a new mutual match. Say hello!',
        };
      case 'HUY_GHEP_DOI':
        return {
          title: 'Match Cancelled',
          body: 'A match has been cancelled.',
        };
      case 'TIN_NHAN_MOI':
        return {
          title: 'New Message',
          body: actorName
            ? `${actorName} sent you a message.`
            : 'You received a new message.',
        };
      case 'XAC_THUC_DUYET':
        return {
          title: 'Student Verification Approved',
          body: 'Your student verification has been approved.',
        };
      case 'XAC_THUC_TU_CHOI':
        return {
          title: 'Student Verification Rejected',
          body: 'Your student verification was rejected. Please review requirements and try again.',
        };
    }
  }

  // Default: Vietnamese ('vi')
  switch (type) {
    case 'GHEP_DOI':
      return {
        title: 'Tương hợp mới!',
        body: actorName
          ? `Bạn và ${actorName} đã tương hợp với nhau. Hãy bắt đầu trò chuyện!`
          : 'Bạn có một tương hợp mới. Hãy bắt đầu trò chuyện!',
      };
    case 'HUY_GHEP_DOI':
      return {
        title: 'Ghép đôi đã hủy',
        body: 'Một kết nối ghép đôi đã bị hủy.',
      };
    case 'TIN_NHAN_MOI':
      return {
        title: 'Tin nhắn mới',
        body: actorName
          ? `${actorName} đã gửi tin nhắn cho bạn.`
          : 'Bạn nhận được một tin nhắn mới.',
      };
    case 'XAC_THUC_DUYET':
      return {
        title: 'Xác thực thành công',
        body: 'Thẻ sinh viên của bạn đã được phê duyệt thành công.',
      };
    case 'XAC_THUC_TU_CHOI':
      return {
        title: 'Xác thực bị từ chối',
        body: 'Yêu cầu xác thực thẻ sinh viên của bạn đã bị từ chối.',
      };
  }
}
