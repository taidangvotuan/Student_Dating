import { NotificationStatus, NotificationType } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import {
  notificationRepository,
  type NotificationRepository,
  type NotificationRecipientWithEvent,
} from './notification.repository.js';
import {
  formatNotificationText,
  type CreateNotificationInput,
  type NotificationInboxItem,
  type NotificationPageResult,
} from './notification.types.js';

export function mapRecipientRecordToInboxItem(
  record: NotificationRecipientWithEvent,
  locale: 'vi' | 'en' = 'vi'
): NotificationInboxItem {
  const actorName = record.notification.actor?.profile?.fullName ?? undefined;
  const { title, body } = formatNotificationText(
    record.notification.type,
    actorName,
    locale
  );

  return {
    id: record.id,
    notificationId: record.notificationId,
    type: record.notification.type,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    readAt: record.readAt?.toISOString() ?? null,
    references: {
      ...(record.notification.matchId ? { matchId: record.notification.matchId } : {}),
      ...(record.notification.conversationId
        ? { conversationId: record.notification.conversationId }
        : {}),
      ...(record.notification.actorId ? { actorId: record.notification.actorId } : {}),
    },
    ...(actorName ? { actorProfile: { fullName: actorName } } : {}),
    title,
    body,
  };
}

export interface NotificationService {
  listNotifications(
    studentId: string,
    limit: number,
    cursor?: string,
    status?: NotificationStatus,
    locale?: 'vi' | 'en'
  ): Promise<NotificationPageResult>;
  getUnreadCount(studentId: string): Promise<{ unreadCount: number }>;
  markAsRead(
    studentId: string,
    receiptId: string,
    locale?: 'vi' | 'en'
  ): Promise<NotificationInboxItem>;
  markAllAsRead(studentId: string): Promise<{ updatedCount: number }>;
  deleteNotification(studentId: string, receiptId: string): Promise<void>;
  createNotification(input: CreateNotificationInput): Promise<string>;
  notifyMatchCreated(
    matchId: string,
    studentAId: string,
    studentBId: string
  ): Promise<string>;
  notifyMatchCancelled(
    matchId: string,
    studentAId: string,
    studentBId: string
  ): Promise<string>;
  notifyVerificationReviewed(
    studentId: string,
    status: 'DA_XAC_THUC' | 'TU_CHOI',
    rejectionReason?: string
  ): Promise<string>;
  notifyNewMessage(
    conversationId: string,
    senderId: string,
    recipientId: string
  ): Promise<string>;
}

export function createNotificationService(
  repository: NotificationRepository = notificationRepository
): NotificationService {
  async function listNotifications(
    studentId: string,
    limit: number,
    cursor?: string,
    status?: NotificationStatus,
    locale: 'vi' | 'en' = 'vi'
  ): Promise<NotificationPageResult> {
    const [{ items, nextCursor }, unreadCount] = await Promise.all([
      repository.listNotifications(studentId, limit, cursor, status),
      repository.getUnreadCount(studentId),
    ]);

    logger.info('[Notification Service] List notifications success', {
      action: 'notification.list.success',
      studentId,
      count: items.length,
      unreadCount,
    });

    return {
      items: items.map((item) => mapRecipientRecordToInboxItem(item, locale)),
      nextCursor,
      unreadCount,
    };
  }

  async function getUnreadCount(studentId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await repository.getUnreadCount(studentId);
    logger.info('[Notification Service] Get unread count success', {
      action: 'notification.unread_count.success',
      studentId,
      unreadCount,
    });
    return { unreadCount };
  }

  async function markAsRead(
    studentId: string,
    receiptId: string,
    locale: 'vi' | 'en' = 'vi'
  ): Promise<NotificationInboxItem> {
    const updated = await repository.markAsRead(studentId, receiptId);
    if (!updated) {
      throw new AppError(404, 'Notification not found.');
    }

    logger.info('[Notification Service] Mark notification read success', {
      action: 'notification.read.success',
      studentId,
      receiptId,
    });

    return mapRecipientRecordToInboxItem(updated, locale);
  }

  async function markAllAsRead(studentId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await repository.markAllAsRead(studentId);
    logger.info('[Notification Service] Mark all notifications read success', {
      action: 'notification.read_all.success',
      studentId,
      updatedCount,
    });
    return { updatedCount };
  }

  async function deleteNotification(
    studentId: string,
    receiptId: string
  ): Promise<void> {
    const deleted = await repository.deleteNotification(studentId, receiptId);
    if (!deleted) {
      throw new AppError(404, 'Notification not found.');
    }

    logger.info('[Notification Service] Delete notification success', {
      action: 'notification.delete.success',
      studentId,
      receiptId,
    });
  }

  async function createNotification(input: CreateNotificationInput): Promise<string> {
    const id = await repository.createNotification(input);
    logger.info('[Notification Service] Create notification success', {
      action: 'notification.created',
      notificationId: id,
      type: input.type,
      recipientCount: input.recipientIds.length,
    });
    return id;
  }

  async function notifyMatchCreated(
    matchId: string,
    studentAId: string,
    studentBId: string
  ): Promise<string> {
    return createNotification({
      type: NotificationType.GHEP_DOI,
      matchId,
      recipientIds: [studentAId, studentBId],
    });
  }

  async function notifyMatchCancelled(
    matchId: string,
    studentAId: string,
    studentBId: string
  ): Promise<string> {
    return createNotification({
      type: NotificationType.HUY_GHEP_DOI,
      matchId,
      recipientIds: [studentAId, studentBId],
    });
  }

  async function notifyVerificationReviewed(
    studentId: string,
    status: 'DA_XAC_THUC' | 'TU_CHOI',
    rejectionReason?: string
  ): Promise<string> {
    return createNotification({
      type:
        status === 'DA_XAC_THUC'
          ? NotificationType.XAC_THUC_DUYET
          : NotificationType.XAC_THUC_TU_CHOI,
      recipientIds: [studentId],
      ...(rejectionReason ? { metadata: { rejectionReason } } : {}),
    });
  }

  async function notifyNewMessage(
    conversationId: string,
    senderId: string,
    recipientId: string
  ): Promise<string> {
    return createNotification({
      type: NotificationType.TIN_NHAN_MOI,
      conversationId,
      actorId: senderId,
      recipientIds: [recipientId],
    });
  }

  return {
    listNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    notifyMatchCreated,
    notifyMatchCancelled,
    notifyVerificationReviewed,
    notifyNewMessage,
  };
}

export const notificationService = createNotificationService();
