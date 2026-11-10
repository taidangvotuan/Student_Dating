import {
  NotificationStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../database/prisma.js';
import type { CreateNotificationInput } from './notification.types.js';

const recipientInclude = {
  notification: {
    include: {
      actor: {
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.NotificationRecipientInclude;

export type NotificationRecipientWithEvent = Prisma.NotificationRecipientGetPayload<{
  include: typeof recipientInclude;
}>;

export interface NotificationRepository {
  createNotification(input: CreateNotificationInput): Promise<string>;
  listNotifications(
    studentId: string,
    limit: number,
    cursor?: string,
    status?: NotificationStatus
  ): Promise<{
    items: readonly NotificationRecipientWithEvent[];
    nextCursor?: string;
  }>;
  getUnreadCount(studentId: string): Promise<number>;
  markAsRead(
    studentId: string,
    receiptId: string
  ): Promise<NotificationRecipientWithEvent | null>;
  markAllAsRead(studentId: string): Promise<number>;
  deleteNotification(studentId: string, receiptId: string): Promise<boolean>;
}

export function createNotificationRepository(
  db: PrismaClient = defaultPrisma
): NotificationRepository {
  async function createNotification(input: CreateNotificationInput): Promise<string> {
    if (input.recipientIds.length === 0) {
      throw new Error('At least one recipient is required to create a notification.');
    }

    const notification = await db.notification.create({
      data: {
        type: input.type,
        actorId: input.actorId,
        matchId: input.matchId,
        conversationId: input.conversationId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        recipients: {
          create: input.recipientIds.map((recipientId) => ({
            recipientId,
            status: NotificationStatus.CHUA_DOC,
          })),
        },
      },
    });

    return notification.id;
  }

  async function listNotifications(
    studentId: string,
    limit: number,
    cursor?: string,
    status?: NotificationStatus
  ) {
    const where: Prisma.NotificationRecipientWhereInput = {
      recipientId: studentId,
      ...(status ? { status } : {}),
    };

    const records = await db.notificationRecipient.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: recipientInclude,
    });

    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return { items, nextCursor };
  }

  async function getUnreadCount(studentId: string): Promise<number> {
    return db.notificationRecipient.count({
      where: {
        recipientId: studentId,
        status: NotificationStatus.CHUA_DOC,
      },
    });
  }

  async function markAsRead(
    studentId: string,
    receiptId: string
  ): Promise<NotificationRecipientWithEvent | null> {
    const now = new Date();
    const updateResult = await db.notificationRecipient.updateMany({
      where: {
        id: receiptId,
        recipientId: studentId,
      },
      data: {
        status: NotificationStatus.DA_DOC,
        readAt: now,
      },
    });

    if (updateResult.count === 0) {
      return null;
    }

    return db.notificationRecipient.findUnique({
      where: { id: receiptId },
      include: recipientInclude,
    });
  }

  async function markAllAsRead(studentId: string): Promise<number> {
    const result = await db.notificationRecipient.updateMany({
      where: {
        recipientId: studentId,
        status: NotificationStatus.CHUA_DOC,
      },
      data: {
        status: NotificationStatus.DA_DOC,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async function deleteNotification(
    studentId: string,
    receiptId: string
  ): Promise<boolean> {
    const result = await db.notificationRecipient.deleteMany({
      where: {
        id: receiptId,
        recipientId: studentId,
      },
    });

    return result.count > 0;
  }

  return {
    createNotification,
    listNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

export const notificationRepository = createNotificationRepository();
