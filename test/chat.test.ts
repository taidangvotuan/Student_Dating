import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ConversationStatus,
  MessageStatus,
  type PrismaClient,
} from '@prisma/client';
import type { Request, Response } from 'express';
import { AppError } from '../src/shared/errors/AppError.js';
import { logger } from '../src/shared/logger/logger.js';
import {
  ChatMessageSchema,
  MessagePageQuerySchema,
} from '../src/modules/chat/chat.schemas.js';
import {
  createChatService,
} from '../src/modules/chat/chat.service.js';
import {
  createChatController,
} from '../src/modules/chat/chat.controller.js';
import {
  createChatRepository,
} from '../src/modules/chat/chat.repository.js';
import { captureInfoLogs } from './helpers/capture-logger.js';
import type {
  ChatRepository,
} from '../src/modules/chat/chat.repository.js';
import type { RealtimePublisher } from '../src/shared/realtime/realtime.events.js';

const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const conversationId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const messageId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const recipientId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

function createRealtimePublisherStub(
  publishToUsers: RealtimePublisher['publishToUsers'] = () => {}
): RealtimePublisher {
  return { publishToUsers };
}

function createRepositoryStub(
  overrides: Partial<ChatRepository> = {}
): ChatRepository {
  return {
    activateConversation: async () => {},
    deactivateConversations: async () => {},
    listConversations: async () => ({ conversations: [], nextCursor: null }),
    getConversation: async () => ({
      id: conversationId,
      matchId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      status: ConversationStatus.HOAT_DONG,
      participants: [],
      lastReadAt: null,
      latestMessage: null,
      unreadCount: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      activityAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    listMessages: async () => ({ messages: [], nextCursor: null }),
    sendMessage: async (senderId, id, body) => ({
      kind: 'created',
      recipientId,
      message: {
        id: messageId,
        conversationId: id,
        senderId,
        body,
        status: MessageStatus.DA_GUI,
        sentAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
      },
    }),
    deleteMessage: async () => ({ kind: 'deleted', message: {
      id: messageId,
      conversationId,
      senderId: userId,
      body: null,
      status: MessageStatus.DA_XOA,
      sentAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    }, recipientId }),
    markRead: async (studentId, id) => ({
      conversationId: id,
      studentId,
      lastReadAt: new Date('2026-01-02T00:00:00.000Z'),
      recipientId,
    }),
    ...overrides,
  };
}

describe('Chat request validation', () => {
  it('accepts trimmed message bodies up to the database limit', () => {
    assert.equal(ChatMessageSchema.safeParse({ body: ' Hello ' }).success, true);
    assert.equal(ChatMessageSchema.safeParse({ body: 'x'.repeat(5000) }).success, true);
    assert.equal(ChatMessageSchema.safeParse({ body: ' '.repeat(2) }).success, false);
    assert.equal(ChatMessageSchema.safeParse({ body: 'x'.repeat(5001) }).success, false);
  });

  it('bounds pagination sizes and validates cursors', () => {
    assert.equal(MessagePageQuerySchema.safeParse({}).success, true);
    assert.equal(MessagePageQuerySchema.safeParse({ limit: '100' }).success, true);
    assert.equal(MessagePageQuerySchema.safeParse({ limit: '101' }).success, false);
    assert.equal(MessagePageQuerySchema.safeParse({ cursor: 'bad' }).success, false);
  });
});

describe('Chat service', () => {
  it('identifies the Chat service and action in structured activity logs', async () => {
    const service = createChatService(createRepositoryStub(), createRealtimePublisherStub());
    const logs = await captureInfoLogs(async () => {
      await service.sendMessage(userId, conversationId, 'private message text');
    });

    assert.deepEqual(logs, [{
      message: '[Chat Service] Send message success',
      metadata: {
        action: 'chat.message.sent',
        studentId: userId,
        conversationId,
        messageId,
      },
    }]);
  });

  it('logs sent-message metadata without exposing the message body', async () => {
    const sharedEntries: Array<{ message: string; metadata: Record<string, unknown> }> = [];
    const originalInfo = Object.getOwnPropertyDescriptor(logger, 'info');
    Object.defineProperty(logger, 'info', {
      configurable: true,
      value: (message: string, metadata: Record<string, unknown>) => {
        sharedEntries.push({ message, metadata });
        return logger;
      },
    });

    try {
      const service = createChatService(
        createRepositoryStub(),
        createRealtimePublisherStub()
      );
      await service.sendMessage(userId, conversationId, 'private message text');
    } finally {
      if (originalInfo) Object.defineProperty(logger, 'info', originalInfo);
      else Reflect.deleteProperty(logger, 'info');
    }

    assert.deepEqual(sharedEntries, [{
      message: '[Chat Service] Send message success',
      metadata: {
        action: 'chat.message.sent',
        studentId: userId,
        conversationId,
        messageId,
      },
    }]);
    assert.equal(JSON.stringify(sharedEntries).includes('private message text'), false);
  });

  it('publishes a committed message only to the other conversation participant', async () => {
    let delivery: { userIds: readonly string[]; event: unknown } | undefined;
    const calls: string[] = [];
    const service = createChatService(
      createRepositoryStub({
        sendMessage: async (senderId, id, body) => {
          calls.push('persist');
          return {
            kind: 'created',
            recipientId,
            message: {
              id: messageId,
              conversationId: id,
              senderId,
              body,
              status: MessageStatus.DA_GUI,
              sentAt: new Date('2026-01-01T00:00:00.000Z'),
              deletedAt: null,
            },
          };
        },
      }),
      createRealtimePublisherStub((userIds, event) => {
        calls.push('publish');
        delivery = { userIds, event };
      })
    );

    await service.sendMessage(userId, conversationId, 'Hello');

    assert.deepEqual(delivery, {
      userIds: [recipientId],
      event: {
        name: 'chat.message.created',
        payload: {
          id: messageId,
          conversationId,
          senderId: userId,
          body: 'Hello',
          status: MessageStatus.DA_GUI,
          sentAt: '2026-01-01T00:00:00.000Z',
          deletedAt: null,
        },
      },
    });
    assert.deepEqual(calls, ['persist', 'publish']);
  });

  it('publishes a read receipt to the other participant and omits the internal recipient from the response', async () => {
    let delivery: { userIds: readonly string[]; event: unknown } | undefined;
    const service = createChatService(
      createRepositoryStub(),
      createRealtimePublisherStub((userIds, event) => {
        delivery = { userIds, event };
      })
    );

    const marker = await service.markRead(userId, conversationId);

    assert.deepEqual(marker, {
      conversationId,
      studentId: userId,
      lastReadAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    assert.deepEqual(delivery, {
      userIds: [recipientId],
      event: {
        name: 'chat.conversation.read',
        payload: {
          conversationId,
          readerId: userId,
          lastReadAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });
  });

  it('publishes message deletion only after a successful delete', async () => {
    let delivery: { userIds: readonly string[]; event: unknown } | undefined;
    const service = createChatService(
      createRepositoryStub(),
      createRealtimePublisherStub((userIds, event) => {
        delivery = { userIds, event };
      })
    );

    await service.deleteMessage(userId, conversationId, messageId);

    assert.deepEqual(delivery, {
      userIds: [recipientId],
      event: {
        name: 'chat.message.deleted',
        payload: {
          messageId,
          conversationId,
          deletedById: userId,
          deletedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });
  });

  it('passes conversation list pagination through to the repository', async () => {
    let received: unknown[] = [];
    const service = createChatService(
      createRepositoryStub({
        listConversations: async (...args) => {
          received = args;
          return { conversations: [], nextCursor: null };
        },
      })
    );

    await service.listConversations(userId, 17, conversationId);

    assert.deepEqual(received, [userId, 17, conversationId]);
  });

  it('hides conversations from non-participants as not found', async () => {
    const service = createChatService(
      createRepositoryStub({ getConversation: async () => null })
    );

    await assert.rejects(
      service.getConversation(userId, conversationId),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it('returns a not-found error for message history outside the conversation', async () => {
    const service = createChatService(
      createRepositoryStub({ listMessages: async () => null })
    );

    await assert.rejects(
      service.listMessages(userId, conversationId, 30),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it('returns a not-found error when marking an inaccessible conversation as read', async () => {
    const service = createChatService(
      createRepositoryStub({ markRead: async () => null })
    );

    await assert.rejects(
      service.markRead(userId, conversationId),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  describe('Chat controller', () => {
    it('uses the authenticated user as sender and validates send message input', async () => {
      const calls: unknown[][] = [];
      const responses: unknown[] = [];
      const controller = createChatController({
        listConversations: async () => ({ conversations: [], nextCursor: null }),
        getConversation: async () => { throw new Error('Unexpected conversation lookup.'); },
        listMessages: async () => { throw new Error('Unexpected message lookup.'); },
        sendMessage: async (...args) => {
          calls.push(args);
          return {
            id: messageId,
            conversationId,
            senderId: userId,
            body: 'Hello',
            status: MessageStatus.DA_GUI,
            sentAt: new Date('2026-01-01T00:00:00.000Z'),
            deletedAt: null,
          };
        },
        deleteMessage: async () => { throw new Error('Unexpected message deletion.'); },
        markRead: async () => { throw new Error('Unexpected read marker update.'); },
      });
      const req = {
        params: { conversationId },
        body: { body: ' Hello ', senderId: 'attacker-id' },
        user: { id: userId },
      } as Request;
      const res = {
        status: () => res,
        json: (body: unknown) => {
          responses.push(body);
          return res;
        },
      } as Response;
      const next = (error?: unknown) => {
        if (error) throw error;
      };

      await controller.sendMessage(req, res, next);

      assert.deepEqual(calls, [[userId, conversationId, 'Hello']]);
      assert.deepEqual(responses, [{
        status: 'success',
        data: {
          id: messageId,
          conversationId,
          senderId: userId,
          body: 'Hello',
          status: MessageStatus.DA_GUI,
          sentAt: new Date('2026-01-01T00:00:00.000Z'),
          deletedAt: null,
        },
      }]);
    });
  });

  describe('Chat repository', () => {
    it('creates or reactivates a conversation with a single upsert', async () => {
      let upsertArgs: unknown;
      const repository = createChatRepository({
        conversation: {
          upsert: async (args: unknown) => {
            upsertArgs = args;
            return {};
          },
        },
      } as unknown as PrismaClient);

      await repository.activateConversation('match-id');

      assert.deepEqual(upsertArgs, {
        where: { matchId: 'match-id' },
        create: { matchId: 'match-id' },
        update: { status: ConversationStatus.HOAT_DONG },
      });
    });

    it('deactivates conversations for canceled match IDs with a single update', async () => {
      let updateArgs: unknown;
      const repository = createChatRepository({
        conversation: {
          updateMany: async (args: unknown) => {
            updateArgs = args;
            return { count: 1 };
          },
        },
      } as unknown as PrismaClient);

      await repository.deactivateConversations(['match-id']);

      assert.deepEqual(updateArgs, {
        where: { matchId: { in: ['match-id'] } },
        data: { status: ConversationStatus.KHONG_HOAT_DONG },
      });
    });

    it('skips conversation updates when match cancellation returned no IDs', async () => {
      const repository = createChatRepository({
        conversation: {
          updateMany: async () => {
            throw new Error('No conversation update should be issued.');
          },
        },
      } as unknown as PrismaClient);

      await repository.deactivateConversations([]);
    });

    it('scopes conversation listings to the caller and calculates unread counts', async () => {
      let query: unknown;
      const repository = createChatRepository({
        $transaction: async (operation: (tx: {
          conversation: {
            aggregate: () => Promise<{ _max: { updatedAt: Date } }>;
            findMany: (args: unknown) => Promise<unknown[]>;
          };
          message: { groupBy: () => Promise<unknown[]> };
        }) => Promise<unknown>) => operation({
          conversation: {
            aggregate: async () => ({ _max: { updatedAt: new Date('2026-01-02T00:00:00.000Z') } }),
            findMany: async (args: unknown) => {
              query = args;
              return [{
                id: conversationId,
                matchId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
                status: ConversationStatus.HOAT_DONG,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                match: {
                  studentA: { studentId: userId, fullName: 'Current user' },
                  studentB: { studentId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', fullName: 'Other user' },
                },
                reads: [],
                messages: [],
              }];
            },
          },
          message: { groupBy: async () => [{ conversationId, _count: { _all: 2 } }] },
        }),
      } as unknown as PrismaClient);

      const page = await repository.listConversations(userId, 20);

      assert.deepEqual(query, {
        where: {
          AND: [
            { match: { is: { OR: [{ studentAId: userId }, { studentBId: userId }] } } },
            { updatedAt: { lte: new Date('2026-01-02T00:00:00.000Z') } },
          ],
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: 21,
        select: {
          id: true,
          matchId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          match: {
            select: {
              studentA: { select: { studentId: true, fullName: true } },
              studentB: { select: { studentId: true, fullName: true } },
            },
          },
          reads: {
            where: { studentId: userId },
            select: { lastReadAt: true },
            take: 1,
          },
          messages: {
            where: { status: MessageStatus.DA_GUI },
            orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { id: true, senderId: true, body: true, sentAt: true },
          },
        },
      });
      assert.equal(page.conversations[0]?.participant.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55');
      assert.equal(page.conversations[0]?.unreadCount, 2);
      assert.equal(page.nextCursor, null);
    });

    it('does not create messages in an inactive conversation', async () => {
      let createAttempted = false;
      const transaction = {
        conversation: {
          findFirst: async () => ({
            id: conversationId,
            status: ConversationStatus.KHONG_HOAT_DONG,
          }),
          updateMany: async () => ({ count: 1 }),
        },
        message: {
          create: async () => {
            createAttempted = true;
            throw new Error('Inactive conversation must not create messages.');
          },
        },
      };
      const repository = createChatRepository({
        $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) =>
          operation(transaction),
      } as unknown as PrismaClient);

      assert.deepEqual(
        await repository.sendMessage(userId, conversationId, 'Hello'),
        { kind: 'inactive' }
      );
      assert.equal(createAttempted, false);
    });

    it('returns the other match participant as the committed message recipient', async () => {
      const message = {
        id: messageId,
        conversationId,
        senderId: userId,
        body: 'Hello',
        status: MessageStatus.DA_GUI,
        sentAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
      };
      const transaction = {
        conversation: {
          findFirst: async () => ({
            id: conversationId,
            status: ConversationStatus.HOAT_DONG,
            match: {
              status: 'DA_GHEP_DOI',
              studentAId: userId,
              studentBId: recipientId,
            },
          }),
          updateMany: async () => ({ count: 1 }),
        },
        message: { create: async () => message },
      };
      const repository = createChatRepository({
        $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) =>
          operation(transaction),
      } as unknown as PrismaClient);

      assert.deepEqual(
        await repository.sendMessage(userId, conversationId, 'Hello'),
        { kind: 'created', recipientId, message }
      );
    });

    it('distinguishes a cancelled match from a missing conversation when sending', async () => {
      let messageCreateAttempted = false;
      const transaction = {
        conversation: {
          findFirst: async () => ({
            id: conversationId,
            status: ConversationStatus.HOAT_DONG,
            match: { status: 'DA_HUY' },
          }),
          updateMany: async () => ({ count: 1 }),
        },
        message: {
          create: async () => {
            messageCreateAttempted = true;
            throw new Error('Cancelled match must not create messages.');
          },
        },
      };
      const repository = createChatRepository({
        $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) =>
          operation(transaction),
      } as unknown as PrismaClient);

      assert.deepEqual(
        await repository.sendMessage(userId, conversationId, 'Hello'),
        { kind: 'inactive' }
      );
      assert.equal(messageCreateAttempted, false);
    });

    it('returns no conversation when the caller is not one of its participants', async () => {
      let query: unknown;
      const repository = createChatRepository({
        conversation: {
          findFirst: async (args: unknown) => {
            query = args;
            return null;
          },
        },
      } as unknown as PrismaClient);

      assert.equal(await repository.getConversation(userId, conversationId), null);
      assert.deepEqual(query, {
        where: {
          id: conversationId,
          match: {
            is: {
              OR: [{ studentAId: userId }, { studentBId: userId }],
            },
          },
        },
        select: {
          id: true,
          matchId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          match: {
            select: {
              studentA: { select: { studentId: true, fullName: true } },
              studentB: { select: { studentId: true, fullName: true } },
            },
          },
          reads: {
            where: { studentId: userId },
            select: { lastReadAt: true },
            take: 1,
          },
          messages: {
            where: { status: MessageStatus.DA_GUI },
            orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { id: true, senderId: true, body: true, sentAt: true },
          },
        },
      });
    });

    it('returns deleted messages in paginated history as tombstones', async () => {
      const tombstone = {
        id: messageId,
        conversationId,
        senderId: userId,
        body: null,
        status: MessageStatus.DA_XOA,
        sentAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: new Date('2026-01-02T00:00:00.000Z'),
      };
      const repository = createChatRepository({
        conversation: {
          findFirst: async () => ({ id: conversationId }),
        },
        message: {
          findMany: async () => [tombstone],
        },
      } as unknown as PrismaClient);

      const page = await repository.listMessages(userId, conversationId, 30);

      assert.deepEqual(page, { messages: [tombstone], nextCursor: null });
    });

    it('returns the other conversation participant when deleting a message', async () => {
      const message = {
        id: messageId,
        conversationId,
        senderId: userId,
        body: 'Hello',
        status: MessageStatus.DA_GUI,
        sentAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
      };
      const transaction = {
        conversation: {
          findFirst: async () => ({
            id: conversationId,
            match: { studentAId: userId, studentBId: recipientId },
          }),
          update: async () => ({}),
        },
        message: {
          findFirst: async () => message,
          updateMany: async () => ({ count: 1 }),
        },
      };
      const repository = createChatRepository({
        $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) =>
          operation(transaction),
      } as unknown as PrismaClient);

      const result = await repository.deleteMessage(userId, conversationId, messageId);

      assert.equal(result.kind, 'deleted');
      if (result.kind !== 'deleted') {
        assert.fail('Expected the message to be deleted.');
      }
      assert.equal(result.recipientId, recipientId);
      assert.equal(result.message.body, null);
      assert.equal(result.message.status, MessageStatus.DA_XOA);
      assert.ok(result.message.deletedAt instanceof Date);
    });

    it('upserts the read marker for the authenticated participant only', async () => {
      let upsertArgs: unknown;
      const transaction = {
        conversation: {
          findFirst: async () => ({
            id: conversationId,
            match: { studentAId: userId, studentBId: recipientId },
          }),
        },
        conversationRead: {
          upsert: async (args: unknown) => {
            upsertArgs = args;
          },
        },
      };
      const repository = createChatRepository({
        $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) =>
          operation(transaction),
      } as unknown as PrismaClient);

      const marker = await repository.markRead(userId, conversationId);

      assert.deepEqual(upsertArgs, {
        where: {
          conversationId_studentId: { conversationId, studentId: userId },
        },
        create: {
          conversationId,
          studentId: userId,
          lastReadAt: marker?.lastReadAt,
        },
        update: { lastReadAt: marker?.lastReadAt },
      });
      assert.equal(marker?.studentId, userId);
      assert.equal(marker?.recipientId, recipientId);
    });

    it('returns a snapshot cursor containing activity time and rejects stale pages', async () => {
      const first = {
        id: conversationId,
        matchId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        status: ConversationStatus.HOAT_DONG,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        match: {
          studentA: { studentId: userId, fullName: 'Current user' },
          studentB: { studentId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', fullName: 'Other user' },
        },
        reads: [],
        messages: [],
      };
      const second = {
        ...first,
        id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      let listQuery: unknown;
      let stale = false;
      const transaction = {
        conversation: {
          aggregate: async () => ({ _max: { updatedAt: first.updatedAt } }),
          count: async () => stale ? 1 : 0,
          findMany: async (args: unknown) => {
            listQuery = args;
            return [first, second];
          },
          findFirst: async () => ({ id: first.id, updatedAt: first.updatedAt }),
        },
        message: {
          groupBy: async () => [],
        },
      };
      const repository = createChatRepository({
        $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) =>
          operation(transaction),
      } as unknown as PrismaClient);

      const page = await repository.listConversations(userId, 1);
      const cursor = page.nextCursor;

      assert.ok(cursor);
      assert.deepEqual(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')), {
        id: first.id,
        activityAt: first.updatedAt.toISOString(),
        snapshotAt: first.updatedAt.toISOString(),
      });

      await repository.listConversations(userId, 1, cursor);
      const where = (listQuery as { where: { AND: Array<Record<string, unknown>> } }).where;
      assert.deepEqual(where.AND[2], {
        OR: [
          { updatedAt: { lt: first.updatedAt } },
          { updatedAt: first.updatedAt, id: { lt: first.id } },
        ],
      });
      stale = true;
      await assert.rejects(
        repository.listConversations(userId, 1, cursor),
        (error: unknown) => error instanceof AppError && error.statusCode === 409
      );
    });
  });

  it('returns a conflict instead of sending to an inactive conversation', async () => {
    const service = createChatService(
      createRepositoryStub({
        sendMessage: async () => ({ kind: 'inactive' }),
      })
    );

    await assert.rejects(
      service.sendMessage(userId, conversationId, 'Hello'),
      (error: unknown) => error instanceof AppError && error.statusCode === 409
    );
  });

  it('prevents deleting another participant’s message', async () => {
    const service = createChatService(
      createRepositoryStub({
        deleteMessage: async () => ({ kind: 'forbidden' }),
      })
    );

    await assert.rejects(
      service.deleteMessage(userId, conversationId, messageId),
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
  });

  it('returns an existing tombstone when a deleted message is deleted again', async () => {
    const tombstone = {
      id: messageId,
      conversationId,
      senderId: userId,
      body: null,
      status: MessageStatus.DA_XOA,
      sentAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    let deliveryCount = 0;
    const service = createChatService(
      createRepositoryStub({
        deleteMessage: async () => ({ kind: 'already-deleted', message: tombstone }),
      }),
      createRealtimePublisherStub(() => {
        deliveryCount += 1;
      })
    );

    assert.deepEqual(
      await service.deleteMessage(userId, conversationId, messageId),
      tombstone
    );
    assert.equal(deliveryCount, 0);
  });
});
