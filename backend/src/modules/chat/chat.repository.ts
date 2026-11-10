import {
  ConversationStatus,
  MatchStatus,
  MessageStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { z } from 'zod';

const participantSelect = {
  studentId: true,
  fullName: true,
} satisfies Prisma.ProfileSelect;

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  body: true,
  status: true,
  sentAt: true,
  deletedAt: true,
} satisfies Prisma.MessageSelect;

export type ChatMessage = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

export interface ChatParticipant {
  readonly id: string;
  readonly fullName: string;
}

function encodeConversationCursor(cursor: ConversationCursor): string {
  return Buffer.from(
    JSON.stringify({
      id: cursor.id,
      activityAt: cursor.activityAt.toISOString(),
      snapshotAt: cursor.snapshotAt.toISOString(),
    })
  ).toString('base64url');
}

function decodeConversationCursor(cursor: string): ConversationCursor {
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new AppError(422, 'Invalid conversation cursor.');
  }
  const parsed = ConversationCursorPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError(422, 'Invalid conversation cursor.');
  }
  return {
    id: parsed.data.id,
    activityAt: new Date(parsed.data.activityAt),
    snapshotAt: new Date(parsed.data.snapshotAt),
  };
}

export interface ConversationListItem {
  readonly id: string;
  readonly matchId: string;
  readonly status: ConversationStatus;
  readonly participant: ChatParticipant;
  readonly latestMessage: Pick<ChatMessage, 'id' | 'senderId' | 'body' | 'sentAt'> | null;
  readonly unreadCount: number;
  readonly createdAt: Date;
  readonly activityAt: Date;
}

export interface ConversationDetails {
  readonly id: string;
  readonly matchId: string;
  readonly status: ConversationStatus;
  readonly participants: readonly ChatParticipant[];
  readonly lastReadAt: Date | null;
  readonly latestMessage: Pick<ChatMessage, 'id' | 'senderId' | 'body' | 'sentAt'> | null;
  readonly unreadCount: number;
  readonly createdAt: Date;
  readonly activityAt: Date;
}

export interface ConversationPage {
  readonly conversations: readonly ConversationListItem[];
  readonly nextCursor: string | null;
}

export interface MessagePage {
  readonly messages: readonly ChatMessage[];
  readonly nextCursor: string | null;
}

export type SendMessageResult =
  | { readonly kind: 'created'; readonly message: ChatMessage; readonly recipientId: string }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'inactive' };

export type DeletedChatMessage = Omit<ChatMessage, 'body' | 'status' | 'deletedAt'> & {
  readonly body: null;
  readonly status: typeof MessageStatus.DA_XOA;
  readonly deletedAt: Date;
};

export type DeleteMessageResult =
  | { readonly kind: 'deleted'; readonly message: DeletedChatMessage; readonly recipientId: string }
  | { readonly kind: 'already-deleted'; readonly message: ChatMessage }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'forbidden' };

export interface ReadMarker {
  readonly conversationId: string;
  readonly studentId: string;
  readonly lastReadAt: Date;
}

export interface ReadMarkerResult extends ReadMarker {
  readonly recipientId: string;
}

export interface ChatRepository {
  activateConversation(matchId: string): Promise<void>;
  deactivateConversations(matchIds: readonly string[]): Promise<void>;
  listConversations(
    studentId: string,
    limit: number,
    cursor?: string
  ): Promise<ConversationPage>;
  getConversation(studentId: string, conversationId: string): Promise<ConversationDetails | null>;
  listMessages(
    studentId: string,
    conversationId: string,
    limit: number,
    cursor?: string
  ): Promise<MessagePage | null>;
  sendMessage(studentId: string, conversationId: string, body: string): Promise<SendMessageResult>;
  deleteMessage(
    studentId: string,
    conversationId: string,
    messageId: string
  ): Promise<DeleteMessageResult>;
  markRead(studentId: string, conversationId: string): Promise<ReadMarkerResult | null>;
}

interface ConversationCursor {
  readonly id: string;
  readonly activityAt: Date;
  readonly snapshotAt: Date;
}

const ConversationCursorPayloadSchema = z.object({
  id: z.string().uuid(),
  activityAt: z.string().datetime(),
  snapshotAt: z.string().datetime(),
});

function participantWhere(studentId: string): Prisma.MatchWhereInput {
  return {
    OR: [{ studentAId: studentId }, { studentBId: studentId }],
  };
}

function conversationSelect(studentId: string) {
  return {
    id: true,
    matchId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    match: {
      select: {
        studentA: { select: participantSelect },
        studentB: { select: participantSelect },
      },
    },
    reads: {
      where: { studentId },
      select: { lastReadAt: true },
      take: 1,
    },
    messages: {
      where: { status: MessageStatus.DA_GUI },
      orderBy: [{ sentAt: 'desc' as const }, { id: 'desc' as const }],
      take: 1,
      select: {
        id: true,
        senderId: true,
        body: true,
        sentAt: true,
      },
    },
  } satisfies Prisma.ConversationSelect;
}

type ConversationRecord = Prisma.ConversationGetPayload<{
  select: ReturnType<typeof conversationSelect>;
}>;

function toParticipant(profile: ConversationRecord['match']['studentA']): ChatParticipant {
  return { id: profile.studentId, fullName: profile.fullName };
}

function toLatestMessage(record: ConversationRecord) {
  return record.messages[0] ?? null;
}

export function createChatRepository(client: PrismaClient = prisma): ChatRepository {
  async function getUnreadCounts(
    client: Prisma.TransactionClient,
    studentId: string,
    conversations: readonly ConversationRecord[]
  ): Promise<Map<string, number>> {
    if (conversations.length === 0) return new Map();

    const unreadFilters = conversations.map((conversation) => {
      const lastReadAt = conversation.reads[0]?.lastReadAt;
      return {
        conversationId: conversation.id,
        ...(lastReadAt && { sentAt: { gt: lastReadAt } }),
      };
    });
    const counts = await client.message.groupBy({
      by: ['conversationId'],
      where: {
        senderId: { not: studentId },
        status: MessageStatus.DA_GUI,
        OR: unreadFilters,
      },
      _count: { _all: true },
    });

    return new Map(counts.map((entry) => [entry.conversationId, entry._count._all]));
  }

  return {
    async activateConversation(matchId) {
      await client.conversation.upsert({
        where: { matchId },
        create: { matchId },
        update: { status: ConversationStatus.HOAT_DONG },
      });
    },

    async deactivateConversations(matchIds) {
      if (matchIds.length === 0) return;
      await client.conversation.updateMany({
        where: { matchId: { in: [...matchIds] } },
        data: { status: ConversationStatus.KHONG_HOAT_DONG },
      });
    },

    async listConversations(studentId, limit, cursor) {
      return client.$transaction(async (transaction) => {
        const access = { match: { is: participantWhere(studentId) } };
        const position = cursor ? decodeConversationCursor(cursor) : undefined;
        let snapshotAt: Date;

        if (position) {
          snapshotAt = position.snapshotAt;
          const cursorConversation = await transaction.conversation.findFirst({
            where: { id: position.id, ...access },
            select: { updatedAt: true },
          });
          if (!cursorConversation) {
            throw new AppError(422, 'Invalid conversation cursor.');
          }
          if (cursorConversation.updatedAt.getTime() !== position.activityAt.getTime()) {
            throw new AppError(409, 'Conversation list changed; restart pagination.');
          }

          const changedCount = await transaction.conversation.count({
            where: { ...access, updatedAt: { gt: snapshotAt } },
          });
          if (changedCount > 0) {
            throw new AppError(409, 'Conversation list changed; restart pagination.');
          }
        } else {
          const aggregate = await transaction.conversation.aggregate({
            where: access,
            _max: { updatedAt: true },
          });
          snapshotAt = aggregate._max.updatedAt ?? new Date();
        }

        const records = await transaction.conversation.findMany({
          where: {
            AND: [
              access,
              { updatedAt: { lte: snapshotAt } },
              ...(position
                ? [{
                  OR: [
                    { updatedAt: { lt: position.activityAt } },
                    { updatedAt: position.activityAt, id: { lt: position.id } },
                  ],
                }]
                : []),
            ],
          },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take: limit + 1,
          select: conversationSelect(studentId),
        });
        const hasMore = records.length > limit;
        const pageRecords = hasMore ? records.slice(0, limit) : records;
        const unreadCounts = await getUnreadCounts(transaction, studentId, pageRecords);
        const conversations = pageRecords.map((record): ConversationListItem => {
          const otherProfile =
            record.match.studentA.studentId === studentId
              ? record.match.studentB
              : record.match.studentA;
          return {
            id: record.id,
            matchId: record.matchId,
            status: record.status,
            participant: toParticipant(otherProfile),
            latestMessage: toLatestMessage(record),
            unreadCount: unreadCounts.get(record.id) ?? 0,
            createdAt: record.createdAt,
            activityAt: record.updatedAt,
          };
        });

        const lastRecord = hasMore ? pageRecords.at(-1) : undefined;
        return {
          conversations,
          nextCursor: lastRecord
            ? encodeConversationCursor({
              id: lastRecord.id,
              activityAt: lastRecord.updatedAt,
              snapshotAt,
            })
            : null,
        };
      }, { isolationLevel: 'RepeatableRead' });
    },

    async getConversation(studentId, conversationId) {
      const record = await client.conversation.findFirst({
        where: {
          id: conversationId,
          match: { is: participantWhere(studentId) },
        },
        select: conversationSelect(studentId),
      });
      if (!record) return null;

      const lastReadAt = record.reads[0]?.lastReadAt;
      const unreadCount = await client.message.count({
        where: {
          conversationId,
          senderId: { not: studentId },
          status: MessageStatus.DA_GUI,
          ...(lastReadAt && { sentAt: { gt: lastReadAt } }),
        },
      });

      return {
        id: record.id,
        matchId: record.matchId,
        status: record.status,
        participants: [
          toParticipant(record.match.studentA),
          toParticipant(record.match.studentB),
        ],
        lastReadAt: lastReadAt ?? null,
        latestMessage: toLatestMessage(record),
        unreadCount,
        createdAt: record.createdAt,
        activityAt: record.updatedAt,
      };
    },

    async listMessages(studentId, conversationId, limit, cursor) {
      const conversation = await client.conversation.findFirst({
        where: {
          id: conversationId,
          match: { is: participantWhere(studentId) },
        },
        select: { id: true },
      });
      if (!conversation) return null;

      if (cursor) {
        const cursorMessage = await client.message.findFirst({
          where: { id: cursor, conversationId },
          select: { id: true },
        });
        if (!cursorMessage) {
          throw new AppError(422, 'Invalid message cursor.');
        }
      }

      const records = await client.message.findMany({
        where: { conversationId },
        orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        select: messageSelect,
      });
      const hasMore = records.length > limit;
      const messages = hasMore ? records.slice(0, limit) : records;
      return {
        messages,
        nextCursor: hasMore ? messages.at(-1)?.id ?? null : null,
      };
    },

    async sendMessage(studentId, conversationId, body) {
      return client.$transaction(async (transaction) => {
        const conversation = await transaction.conversation.findFirst({
          where: {
            id: conversationId,
            match: { is: participantWhere(studentId) },
          },
          select: {
            id: true,
            status: true,
            match: {
              select: {
                status: true,
                studentAId: true,
                studentBId: true,
              },
            },
          },
        });
        if (!conversation) return { kind: 'not-found' };
        if (
          conversation.status !== ConversationStatus.HOAT_DONG ||
          conversation.match.status === MatchStatus.DA_HUY
        ) {
          return { kind: 'inactive' };
        }

        const sentAt = new Date();
        const activated = await transaction.conversation.updateMany({
          where: {
            id: conversationId,
            status: ConversationStatus.HOAT_DONG,
          },
          data: { updatedAt: sentAt },
        });
        if (activated.count === 0) return { kind: 'inactive' };

        const message = await transaction.message.create({
          data: { conversationId, senderId: studentId, body, sentAt },
          select: messageSelect,
        });
        const recipientId =
          conversation.match.studentAId === studentId
            ? conversation.match.studentBId
            : conversation.match.studentAId;
        return { kind: 'created', message, recipientId };
      });
    },

    async deleteMessage(studentId, conversationId, messageId) {
      return client.$transaction(async (transaction) => {
        const conversation = await transaction.conversation.findFirst({
          where: {
            id: conversationId,
            match: { is: participantWhere(studentId) },
          },
          select: {
            id: true,
            match: {
              select: {
                studentAId: true,
                studentBId: true,
              },
            },
          },
        });
        if (!conversation) return { kind: 'not-found' };

        const message = await transaction.message.findFirst({
          where: { id: messageId, conversationId },
          select: messageSelect,
        });
        if (!message) return { kind: 'not-found' };
        if (message.senderId !== studentId) return { kind: 'forbidden' };
        if (message.status === MessageStatus.DA_XOA) {
          return { kind: 'already-deleted', message };
        }

        const deletedAt = new Date();
        const result = await transaction.message.updateMany({
          where: { id: messageId, conversationId, senderId: studentId, status: MessageStatus.DA_GUI },
          data: { status: MessageStatus.DA_XOA, body: null, deletedAt },
        });
        if (result.count === 0) {
          const currentMessage = await transaction.message.findFirst({
            where: { id: messageId, conversationId, senderId: studentId },
            select: messageSelect,
          });
          if (!currentMessage) return { kind: 'not-found' };
          if (currentMessage.status === MessageStatus.DA_XOA) {
            return { kind: 'already-deleted', message: currentMessage };
          }
          return { kind: 'not-found' };
        }

        await transaction.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: deletedAt },
        });

        return {
          kind: 'deleted',
          message: { ...message, body: null, status: MessageStatus.DA_XOA, deletedAt },
          recipientId:
            conversation.match.studentAId === studentId
              ? conversation.match.studentBId
              : conversation.match.studentAId,
        };
      });
    },

    async markRead(studentId, conversationId) {
      return client.$transaction(async (transaction) => {
        const conversation = await transaction.conversation.findFirst({
          where: {
            id: conversationId,
            match: { is: participantWhere(studentId) },
          },
          select: {
            id: true,
            match: {
              select: {
                studentAId: true,
                studentBId: true,
              },
            },
          },
        });
        if (!conversation) return null;

        const lastReadAt = new Date();
        await transaction.conversationRead.upsert({
          where: {
            conversationId_studentId: { conversationId, studentId },
          },
          create: { conversationId, studentId, lastReadAt },
          update: { lastReadAt },
        });
        return {
          conversationId,
          studentId,
          lastReadAt,
          recipientId:
            conversation.match.studentAId === studentId
              ? conversation.match.studentBId
              : conversation.match.studentAId,
        };
      });
    },
  };
}

export const chatRepository = createChatRepository();
