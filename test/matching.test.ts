import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchStatus, type PrismaClient } from '@prisma/client';
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

const event: LikeCreatedEvent = {
  actorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  targetId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
};

describe('MatchingRepository', () => {
  it('upserts the canonical pair with DA_GHEP_DOI status', async () => {
    let upsertArgs: unknown;
    const repository = createMatchingRepository({
      match: {
        upsert: async (args: unknown) => {
          upsertArgs = args;
          return { id: 'match-id' };
        },
      },
    } as unknown as PrismaClient);

    await repository.createOrReactivateMatch(event.actorId, event.targetId);

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

  it('cancels the canonical pair and deactivates its conversations without a separate match lookup', async () => {
    const matchLookups: unknown[] = [];
    const conversationUpdates: unknown[] = [];
    const repository = createMatchingRepository({
      match: {
        updateManyAndReturn: async () => [{ id: 'match-id' }],
        findUnique: async (query: unknown) => {
          matchLookups.push(query);
          return null;
        },
      },
      conversation: {
        updateMany: async (query: unknown) => {
          conversationUpdates.push(query);
          return { count: 1 };
        },
      },
    } as unknown as PrismaClient);

    await repository.cancelMatchAndDeactivateConversation(event.actorId, event.targetId);

    assert.equal(matchLookups.length, 0);
    assert.equal(conversationUpdates.length, 1);
  });
});

function createMatchingRepositoryStub(
  overrides: Partial<MatchingRepository> = {}
): MatchingRepository {
  return {
    areAccountsActive: async () => true,
    hasBlockBetween: async () => false,
    hasReciprocalLike: async () => true,
    createOrReactivateMatch: async () => {},
    cancelMatchAndDeactivateConversation: async () => {},
    ...overrides,
  };
}

describe('MatchingService', () => {
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
        },
      })
    );

    assert.equal(await service.handleLikeCreated(event), true);
    assert.deepEqual(calls, [
      'check-accounts',
      'check-block',
      'check-reciprocal-like',
      'create-match',
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
        createOrReactivateMatch: createMatch,
      })
    );
    const oneSidedLikeService = createMatchingService(
      createMatchingRepositoryStub({
        hasReciprocalLike: async () => false,
        createOrReactivateMatch: createMatch,
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
