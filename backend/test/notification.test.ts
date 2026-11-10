import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationType, NotificationStatus, type PrismaClient } from '@prisma/client';
import { formatNotificationText } from '../src/modules/notification/notification.types.js';
import {
  NotificationPageQuerySchema,
  NotificationParamsSchema,
} from '../src/modules/notification/notification.schemas.js';
import {
  createNotificationRepository,
  type NotificationRepository,
  type NotificationRecipientWithEvent,
} from '../src/modules/notification/notification.repository.js';
import {
  createNotificationService,
  mapRecipientRecordToInboxItem,
} from '../src/modules/notification/notification.service.js';
import { createNotificationController } from '../src/modules/notification/notification.controller.js';
import { AppError } from '../src/shared/errors/AppError.js';

const studentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const otherStudentId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const mockReceiptId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const mockNotificationId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const mockMatchId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

function createMockRecipientRecord(
  overrides?: Partial<NotificationRecipientWithEvent>
): NotificationRecipientWithEvent {
  return {
    id: mockReceiptId,
    notificationId: mockNotificationId,
    recipientId: studentId,
    status: NotificationStatus.CHUA_DOC,
    readAt: null,
    createdAt: new Date('2026-11-07T00:00:00.000Z'),
    notification: {
      id: mockNotificationId,
      type: NotificationType.GHEP_DOI,
      actorId: otherStudentId,
      matchId: mockMatchId,
      conversationId: null,
      metadata: {},
      createdAt: new Date('2026-11-07T00:00:00.000Z'),
      actor: {
        id: otherStudentId,
        accountStatus: 'HOAT_DONG',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          fullName: 'Tran Thi B',
        },
      },
    },
    ...overrides,
  };
}

describe('Notification Module & Schema Contracts', () => {
  it('exports expected NotificationType enum values', () => {
    assert.equal(NotificationType.GHEP_DOI, 'GHEP_DOI');
    assert.equal(NotificationType.HUY_GHEP_DOI, 'HUY_GHEP_DOI');
    assert.equal(NotificationType.TIN_NHAN_MOI, 'TIN_NHAN_MOI');
    assert.equal(NotificationType.XAC_THUC_DUYET, 'XAC_THUC_DUYET');
    assert.equal(NotificationType.XAC_THUC_TU_CHOI, 'XAC_THUC_TU_CHOI');
  });

  it('exports expected NotificationStatus enum values', () => {
    assert.equal(NotificationStatus.CHUA_DOC, 'CHUA_DOC');
    assert.equal(NotificationStatus.DA_DOC, 'DA_DOC');
  });

  it('formats notification text dynamically without static text in database (vi & en)', () => {
    const viMatch = formatNotificationText(NotificationType.GHEP_DOI, 'Nguyen Van B', 'vi');
    assert.equal(viMatch.title, 'Tương hợp mới!');
    assert.match(viMatch.body, /Nguyen Van B/);

    const enMatch = formatNotificationText(NotificationType.GHEP_DOI, 'Nguyen Van B', 'en');
    assert.equal(enMatch.title, 'New Match!');
    assert.match(enMatch.body, /Nguyen Van B/);

    const viMsg = formatNotificationText(NotificationType.TIN_NHAN_MOI, 'Le Thi C', 'vi');
    assert.equal(viMsg.title, 'Tin nhắn mới');
    assert.match(viMsg.body, /Le Thi C/);

    const viVerify = formatNotificationText(NotificationType.XAC_THUC_DUYET, undefined, 'vi');
    assert.equal(viVerify.title, 'Xác thực thành công');
  });

  it('maps recipient record to inbox item correctly', () => {
    const record = createMockRecipientRecord();
    const item = mapRecipientRecordToInboxItem(record, 'vi');
    assert.equal(item.id, mockReceiptId);
    assert.equal(item.notificationId, mockNotificationId);
    assert.equal(item.type, NotificationType.GHEP_DOI);
    assert.equal(item.status, NotificationStatus.CHUA_DOC);
    assert.equal(item.title, 'Tương hợp mới!');
    assert.match(item.body, /Tran Thi B/);
    assert.equal(item.references.matchId, mockMatchId);
  });
});

describe('Notification Request Validation Schemas', () => {
  it('validates notification params with uuid', () => {
    const valid = NotificationParamsSchema.safeParse({ id: mockReceiptId });
    assert.equal(valid.success, true);

    const invalid = NotificationParamsSchema.safeParse({ id: 'not-a-uuid' });
    assert.equal(invalid.success, false);
  });

  it('validates query pagination, status filter, and locale defaults', () => {
    const defaults = NotificationPageQuerySchema.parse({});
    assert.equal(defaults.limit, 20);
    assert.equal(defaults.cursor, undefined);
    assert.equal(defaults.status, undefined);
    assert.equal(defaults.locale, undefined);

    const parsed = NotificationPageQuerySchema.parse({
      limit: '15',
      cursor: mockReceiptId,
      status: 'CHUA_DOC',
      locale: 'en',
    });
    assert.equal(parsed.limit, 15);
    assert.equal(parsed.cursor, mockReceiptId);
    assert.equal(parsed.status, NotificationStatus.CHUA_DOC);
    assert.equal(parsed.locale, 'en');

    const invalidLimit = NotificationPageQuerySchema.safeParse({ limit: '100' });
    assert.equal(invalidLimit.success, false);
  });
});

describe('Notification Repository', () => {
  it('creates notification and recipients', async () => {
    let createArgs: any;
    const mockPrisma = {
      notification: {
        create: async (args: any) => {
          createArgs = args;
          return { id: mockNotificationId };
        },
      },
    } as unknown as PrismaClient;

    const repository = createNotificationRepository(mockPrisma);
    const id = await repository.createNotification({
      type: NotificationType.GHEP_DOI,
      matchId: mockMatchId,
      recipientIds: [studentId, otherStudentId],
    });

    assert.equal(id, mockNotificationId);
    assert.equal(createArgs.data.type, NotificationType.GHEP_DOI);
    assert.equal(createArgs.data.recipients.create.length, 2);
  });

  it('lists notifications and computes nextCursor', async () => {
    const record1 = createMockRecipientRecord({ id: '11111111-1111-1111-1111-111111111111' });
    const record2 = createMockRecipientRecord({ id: '22222222-2222-2222-2222-222222222222' });

    const mockPrisma = {
      notificationRecipient: {
        findMany: async () => [record1, record2],
      },
    } as unknown as PrismaClient;

    const repository = createNotificationRepository(mockPrisma);
    const page = await repository.listNotifications(studentId, 1);

    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].id, record1.id);
    assert.equal(page.nextCursor, record1.id);
  });

  it('marks single notification as read', async () => {
    const updatedRecord = createMockRecipientRecord({
      status: NotificationStatus.DA_DOC,
      readAt: new Date(),
    });

    const mockPrisma = {
      notificationRecipient: {
        updateMany: async () => ({ count: 1 }),
        findUnique: async () => updatedRecord,
      },
    } as unknown as PrismaClient;

    const repository = createNotificationRepository(mockPrisma);
    const result = await repository.markAsRead(studentId, mockReceiptId);

    assert.notEqual(result, null);
    assert.equal(result!.status, NotificationStatus.DA_DOC);
  });

  it('returns null when marking non-existent notification as read', async () => {
    const mockPrisma = {
      notificationRecipient: {
        updateMany: async () => ({ count: 0 }),
      },
    } as unknown as PrismaClient;

    const repository = createNotificationRepository(mockPrisma);
    const result = await repository.markAsRead(studentId, mockReceiptId);
    assert.equal(result, null);
  });

  it('marks all as read and deletes notification', async () => {
    const mockPrisma = {
      notificationRecipient: {
        updateMany: async () => ({ count: 5 }),
        deleteMany: async () => ({ count: 1 }),
      },
    } as unknown as PrismaClient;

    const repository = createNotificationRepository(mockPrisma);
    const updatedCount = await repository.markAllAsRead(studentId);
    assert.equal(updatedCount, 5);

    const deleted = await repository.deleteNotification(studentId, mockReceiptId);
    assert.equal(deleted, true);
  });
});

describe('Notification Service', () => {
  function createRepoStub(): NotificationRepository {
    const record = createMockRecipientRecord();
    return {
      createNotification: async () => mockNotificationId,
      listNotifications: async () => ({ items: [record], nextCursor: undefined }),
      getUnreadCount: async () => 1,
      markAsRead: async () => ({ ...record, status: NotificationStatus.DA_DOC, readAt: new Date() }),
      markAllAsRead: async () => 3,
      deleteNotification: async () => true,
    };
  }

  it('lists notifications with dynamic localization and unread count', async () => {
    const service = createNotificationService(createRepoStub());
    const res = await service.listNotifications(studentId, 20, undefined, undefined, 'en');

    assert.equal(res.items.length, 1);
    assert.equal(res.unreadCount, 1);
    assert.equal(res.items[0].title, 'New Match!');
  });

  it('gets unread count', async () => {
    const service = createNotificationService(createRepoStub());
    const res = await service.getUnreadCount(studentId);
    assert.equal(res.unreadCount, 1);
  });

  it('marks notification as read or throws 404', async () => {
    const service = createNotificationService(createRepoStub());
    const res = await service.markAsRead(studentId, mockReceiptId);
    assert.equal(res.status, NotificationStatus.DA_DOC);

    const notFoundService = createNotificationService({
      ...createRepoStub(),
      markAsRead: async () => null,
    });
    await assert.rejects(
      () => notFoundService.markAsRead(studentId, mockReceiptId),
      (err: any) => err instanceof AppError && err.statusCode === 404
    );
  });

  it('marks all as read', async () => {
    const service = createNotificationService(createRepoStub());
    const res = await service.markAllAsRead(studentId);
    assert.equal(res.updatedCount, 3);
  });

  it('deletes notification or throws 404', async () => {
    const service = createNotificationService(createRepoStub());
    await assert.doesNotReject(() => service.deleteNotification(studentId, mockReceiptId));

    const notFoundService = createNotificationService({
      ...createRepoStub(),
      deleteNotification: async () => false,
    });
    await assert.rejects(
      () => notFoundService.deleteNotification(studentId, mockReceiptId),
      (err: any) => err instanceof AppError && err.statusCode === 404
    );
  });

  it('dispatches notifyMatchCreated, notifyMatchCancelled, notifyVerificationReviewed', async () => {
    let lastCreatedInput: any;
    const service = createNotificationService({
      ...createRepoStub(),
      createNotification: async (input) => {
        lastCreatedInput = input;
        return 'notif-id';
      },
    });

    await service.notifyMatchCreated(mockMatchId, studentId, otherStudentId);
    assert.equal(lastCreatedInput.type, NotificationType.GHEP_DOI);
    assert.equal(lastCreatedInput.matchId, mockMatchId);
    assert.equal(lastCreatedInput.recipientIds.length, 2);

    await service.notifyMatchCancelled(mockMatchId, studentId, otherStudentId);
    assert.equal(lastCreatedInput.type, NotificationType.HUY_GHEP_DOI);

    await service.notifyVerificationReviewed(studentId, 'DA_XAC_THUC');
    assert.equal(lastCreatedInput.type, NotificationType.XAC_THUC_DUYET);

    await service.notifyVerificationReviewed(studentId, 'TU_CHOI', 'Thẻ mờ');
    assert.equal(lastCreatedInput.type, NotificationType.XAC_THUC_TU_CHOI);
    assert.equal(lastCreatedInput.metadata.rejectionReason, 'Thẻ mờ');
  });
});

describe('Notification Controller', () => {
  function createMockResponse() {
    const res: any = {};
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body: any) => {
      res.body = body;
      return res;
    };
    return res;
  }

  it('handles listNotifications HTTP request', async () => {
    const controller = createNotificationController({
      listNotifications: async () => ({ items: [], unreadCount: 0 }),
    } as any);

    const req: any = {
      user: { id: studentId },
      query: { limit: '10' },
      headers: {},
    };
    const res = createMockResponse();

    await controller.listNotifications(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'success');
  });

  it('handles markAsRead HTTP request', async () => {
    const controller = createNotificationController({
      markAsRead: async () => ({ id: mockReceiptId, status: NotificationStatus.DA_DOC }),
    } as any);

    const req: any = {
      user: { id: studentId },
      params: { id: mockReceiptId },
      query: {},
      headers: {},
    };
    const res = createMockResponse();

    await controller.markAsRead(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'success');
  });

  it('handles deleteNotification HTTP request', async () => {
    const controller = createNotificationController({
      deleteNotification: async () => {},
    } as any);

    const req: any = {
      user: { id: studentId },
      params: { id: mockReceiptId },
    };
    const res = createMockResponse();

    await controller.deleteNotification(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'success');
  });
});

describe('NotificationListener (In-memory Event Bus)', () => {
  it('subscribes to matching.match-created and creates mutual notification asynchronously', async () => {
    const { EventBus } = await import('../src/shared/events/event-bus.js');
    const { registerNotificationListener } = await import(
      '../src/modules/notification/notification.listener.js'
    );
    const eventBus = new EventBus<import('../src/shared/events/matching.events.js').MatchingEvents>();
    let matchCreatedCall: any;

    const unregister = registerNotificationListener(eventBus, {
      notifyMatchCreated: async (matchId, a, b) => {
        matchCreatedCall = { matchId, a, b };
        return 'notif-id';
      },
      notifyMatchCancelled: async () => 'notif-id',
    });

    eventBus.publish('matching.match-created', {
      matchId: mockMatchId,
      studentAId: studentId,
      studentBId: otherStudentId,
    });

    await new Promise<void>((resolve) => setImmediate(resolve));
    unregister();

    assert.deepEqual(matchCreatedCall, {
      matchId: mockMatchId,
      a: studentId,
      b: otherStudentId,
    });
  });

  it('does not notify users when matching.match-cancelled is published', async () => {
    const { EventBus } = await import('../src/shared/events/event-bus.js');
    const { registerNotificationListener } = await import(
      '../src/modules/notification/notification.listener.js'
    );
    const eventBus = new EventBus<import('../src/shared/events/matching.events.js').MatchingEvents>();
    const cancelledCalls: any[] = [];

    const unregister = registerNotificationListener(eventBus, {
      notifyMatchCreated: async () => 'notif-id',
      notifyMatchCancelled: async (matchId, a, b) => {
        cancelledCalls.push({ matchId, a, b });
        return 'notif-id';
      },
    });

    eventBus.publish('matching.match-cancelled', {
      matchIds: ['match-1', 'match-2'],
      firstStudentId: studentId,
      secondStudentId: otherStudentId,
    });

    await new Promise<void>((resolve) => setImmediate(resolve));
    unregister();

    assert.deepEqual(cancelledCalls, []);
  });

  it('reports async error when notifyMatchCreated fails without throwing from eventBus', async () => {
    const { EventBus } = await import('../src/shared/events/event-bus.js');
    const { registerNotificationListener } = await import(
      '../src/modules/notification/notification.listener.js'
    );
    const eventBus = new EventBus<import('../src/shared/events/matching.events.js').MatchingEvents>();
    const errors: any[] = [];

    const unregister = registerNotificationListener(
      eventBus,
      {
        notifyMatchCreated: async () => {
          throw new Error('database write failed');
        },
        notifyMatchCancelled: async () => 'notif-id',
      },
      (eventName, payload, error) => {
        errors.push({ eventName, payload, error });
      }
    );

    eventBus.publish('matching.match-created', {
      matchId: mockMatchId,
      studentAId: studentId,
      studentBId: otherStudentId,
    });

    await new Promise<void>((resolve) => setImmediate(resolve));
    unregister();

    assert.equal(errors.length, 1);
    assert.equal(errors[0].eventName, 'matching.match-created');
    assert.equal((errors[0].error as Error).message, 'database write failed');
  });

  it('subscribes to user.verification-reviewed and notifies verification decision asynchronously', async () => {
    const { EventBus } = await import('../src/shared/events/event-bus.js');
    const { registerNotificationListener } = await import(
      '../src/modules/notification/notification.listener.js'
    );
    const matchingBus = new EventBus<import('../src/shared/events/matching.events.js').MatchingEvents>();
    const userBus = new EventBus<import('../src/shared/events/user.events.js').UserEvents>();
    let verificationCall: any;

    const unregister = registerNotificationListener(
      matchingBus,
      userBus,
      {
        notifyMatchCreated: async () => 'notif-id',
        notifyMatchCancelled: async () => 'notif-id',
        notifyVerificationReviewed: async (studentId, status, rejectionReason) => {
          verificationCall = { studentId, status, rejectionReason };
          return 'notif-id';
        },
      }
    );

    userBus.publish('user.verification-reviewed', {
      userId: studentId,
      reviewerId: otherStudentId,
      status: 'DA_XAC_THUC',
    });

    await new Promise<void>((resolve) => setImmediate(resolve));
    unregister();

    assert.deepEqual(verificationCall, {
      studentId,
      status: 'DA_XAC_THUC',
      rejectionReason: undefined,
    });
  });
});
