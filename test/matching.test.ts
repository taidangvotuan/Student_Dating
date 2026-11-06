import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchStatus, type PrismaClient } from '@prisma/client';
import { captureInfoLogs } from './helpers/capture-logger.js';
import { logger } from '../src/shared/logger/logger.js';
import { EventBus } from '../src/shared/events/event-bus.js';
import type {
  InteractionEvents,
  LikeCreatedEvent,
} from '../src/shared/events/interaction.events.js';
import { registerMatchingListener } from '../src/modules/matching/matching.listener.js';
import { createMatchingService } from '../src/modules/matching/matching.service.js';
import {
  createMatchingRepository,
  type MatchingRepository,
} from '../src/modules/matching/matching.repository.js';
import type { RealtimePublisher } from '../src/shared/realtime/realtime.events.js';

const event: LikeCreatedEvent = {
  actorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  targetId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
};
const realtimePublisher: RealtimePublisher = { publishToUsers: () => {} };

describe('MatchingRepository', () => {
  it('upserts a match without writing conversation data or opening a transaction', async () => {
    let upsertArgs: unknown;
    const repository = createMatchingRepository({
      match: {
        upsert: async (args: unknown) => {
          upsertArgs = args;
          return { id: 'match-id' };
        },
      },
    } as unknown as PrismaClient);

    const matchId = await repository.createOrReactivateMatch(event.actorId, event.targetId);

    assert.equal(matchId, 'match-id');
    assert.deepEqual(upsertArgs, {
      where: {
        studentAId_studentBId: {
          studentAId: event.actorId,
          studentBId: event.targetId,
        },
      },
      create: {
        studentAId: event.actorId,
        studentBId: event.targetId,
      },
      update: { status: MatchStatus.DA_GHEP_DOI },
      select: { id: true },
    });
  });

  it('cancels the canonical pair and returns affected match IDs without conversation writes', async () => {
    let matchUpdate: unknown;
    const repository = createMatchingRepository({
      match: {
        updateManyAndReturn: async (args: unknown) => {
          matchUpdate = args;
          return [{ id: 'match-id' }];
        },
      },
    } as unknown as PrismaClient);

    const matchIds = await repository.cancelMatch(event.actorId, event.targetId);

    assert.deepEqual(matchIds, ['match-id']);
    assert.deepEqual(matchUpdate, {
      where: { studentAId: event.actorId, studentBId: event.targetId },
      data: { status: MatchStatus.DA_HUY },
      select: { id: true },
    });
  });
});

function createMatchingRepositoryStub(
  overrides: Partial<MatchingRepository> = {}
): MatchingRepository {
  return {
    areAccountsActive: async () => true,
    hasBlockBetween: async () => false,
    hasReciprocalLike: async () => true,
    createOrReactivateMatch: async () => 'match-id',
    cancelMatch: async () => ['match-id'],
    ...overrides,
  };
}

describe('MatchingService', () => {
  it('identifies the Matching service and match action in structured logs', async () => {
    const service = createMatchingService(
      createMatchingRepositoryStub(),
      {
        activateConversation: async () => {},
        deactivateConversations: async () => {},
      },
      realtimePublisher
    );
    const logs = await captureInfoLogs(async () => {
      await service.handleLikeCreated(event);
    });

    assert.deepEqual(logs, [{
      message: '[Matching Service] Handle like created success',
      metadata: {
        action: 'matching.match.created_or_reactivated',
        actorId: event.actorId,
        targetId: event.targetId,
        matchId: 'match-id',
        matched: true,
      },
    }]);
  });

  it('logs match creation through the shared logger', async () => {
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
      const service = createMatchingService(
        createMatchingRepositoryStub(),
        {
          activateConversation: async () => {},
          deactivateConversations: async () => {},
        },
        realtimePublisher
      );
      await service.handleLikeCreated(event);
    } finally {
      if (originalInfo) Object.defineProperty(logger, 'info', originalInfo);
      else Reflect.deleteProperty(logger, 'info');
    }

    assert.deepEqual(sharedEntries, [{
      message: '[Matching Service] Handle like created success',
      metadata: {
        action: 'matching.match.created_or_reactivated',
        actorId: event.actorId,
        targetId: event.targetId,
        matchId: 'match-id',
        matched: true,
      },
    }]);
  });

  it('creates a match only after active-account, no-block, and reciprocal-like checks pass', async () => {
    const calls: string[] = [];
    const service = createMatchingService(
      createMatchingRepositoryStub({
        areAccountsActive: async () => {
          calls.push('check-accounts');
          return true;
        },
        hasBlockBetween: async () => {
          calls.push('check-block');
          return false;
        },
        hasReciprocalLike: async () => {
          calls.push('check-reciprocal-like');
          return true;
        },
        createOrReactivateMatch: async () => {
          calls.push('create-match');
          return 'match-id';
        },
      }),
      {
        activateConversation: async (matchId) => {
          calls.push(`activate-conversation:${matchId}`);
        },
        deactivateConversations: async () => {},
      },
      {
        publishToUsers: (userIds, realtimeEvent) => {
          calls.push(`publish:${userIds.join(',')}:${realtimeEvent.name}`);
        },
      }
    );

    assert.equal(await service.handleLikeCreated(event), true);
    assert.deepEqual(calls, [
      'check-accounts',
      'check-block',
      'check-reciprocal-like',
      'create-match',
      'activate-conversation:match-id',
      `publish:${event.actorId},${event.targetId}:matching.match.created`,
    ]);
  });

  it('cancels a match then asks Chat to deactivate conversations for returned match IDs', async () => {
    const calls: string[] = [];
    const service = createMatchingService(
      createMatchingRepositoryStub({
        cancelMatch: async () => {
          calls.push('cancel-match');
          return ['match-id'];
        },
      }),
      {
        activateConversation: async () => {},
        deactivateConversations: async (matchIds) => {
          calls.push(`deactivate-conversations:${matchIds.join(',')}`);
        },
      },
      {
        publishToUsers: (userIds, realtimeEvent) => {
          calls.push(`publish:${userIds.join(',')}:${realtimeEvent.name}`);
        },
      }
    );

    await service.cancelMatch(event.actorId, event.targetId);

    assert.deepEqual(calls, [
      'cancel-match',
      'deactivate-conversations:match-id',
      `publish:${event.actorId},${event.targetId}:matching.match.cancelled`,
    ]);
  });

  it('does not create a match if either account is inactive', async () => {
    let matchWasCreated = false;
    const service = createMatchingService(
      createMatchingRepositoryStub({
        areAccountsActive: async () => false,
        createOrReactivateMatch: async () => {
          matchWasCreated = true;
        },
      })
    );

    assert.equal(await service.handleLikeCreated(event), false);
    assert.equal(matchWasCreated, false);
  });

  it('does not create a match for a blocked pair or a one-sided like', async () => {
    let matchCreateCount = 0;
    const createMatch = async () => {
      matchCreateCount += 1;
    };
    const blockedService = createMatchingService(
      createMatchingRepositoryStub({
        hasBlockBetween: async () => true,
        createOrReactivateMatch: async () => { await createMatch(); return 'match-id'; },
      })
    );
    const oneSidedLikeService = createMatchingService(
      createMatchingRepositoryStub({
        hasReciprocalLike: async () => false,
        createOrReactivateMatch: async () => { await createMatch(); return 'match-id'; },
      })
    );

    assert.equal(await blockedService.handleLikeCreated(event), false);
    assert.equal(await oneSidedLikeService.handleLikeCreated(event), false);
    assert.equal(matchCreateCount, 0);
  });

  it('propagates repository errors to the event listener for logging', async () => {
    const failure = new Error('database unavailable');
    const service = createMatchingService(
      createMatchingRepositoryStub({
        areAccountsActive: async () => {
          throw failure;
        },
      })
    );

    await assert.rejects(() => service.handleLikeCreated(event), failure);
  });
});

describe('MatchingListener', () => {
  it('handles matching asynchronously and reports failures without throwing from event emission', async () => {
    const eventBus = new EventBus<InteractionEvents>();
    const errors: Array<{ event: LikeCreatedEvent; error: unknown }> = [];
    let resolveHandlerStarted: (() => void) | undefined;
    const handlerStarted = new Promise<void>((resolve) => {
      resolveHandlerStarted = resolve;
    });
    const unregister = registerMatchingListener(
      eventBus,
      {
        handleLikeCreated: async () => {
          resolveHandlerStarted?.();
          throw new Error('matching failed');
        },
      },
      (failedEvent, error) => {
        errors.push({ event: failedEvent, error });
      }
    );

    eventBus.publish('interaction.like-created', event);
    await handlerStarted;
    await new Promise<void>((resolve) => setImmediate(resolve));
    unregister();

    assert.equal(errors.length, 1);
    const reportedError = errors[0]?.error;
    assert.deepEqual(errors[0]?.event, event);
    assert.ok(reportedError instanceof Error);
    assert.equal(reportedError.message, 'matching failed');
  });
});
