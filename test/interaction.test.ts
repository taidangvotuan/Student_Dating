import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { InteractionTargetParamsSchema } from '../src/modules/interaction/interaction.schemas.js';
import { createInteractionController } from '../src/modules/interaction/interaction.controller.js';
import { createInteractionService } from '../src/modules/interaction/interaction.service.js';
import { EventBus } from '../src/shared/events/event-bus.js';
import {
  createInteractionRepository as createPrismaInteractionRepository,
  type InteractionRepository,
} from '../src/modules/interaction/interaction.repository.js';
import type { InteractionEvents } from '../src/shared/events/interaction.events.js';
import { AppError } from '../src/shared/errors/AppError.js';
import { captureInfoLogs } from './helpers/capture-logger.js';

const actorId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const targetId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function createInteractionRepositoryStub(
  overrides: Partial<InteractionRepository> = {}
): InteractionRepository {
  return {
    getActionEligibility: async () => ({ actorExists: true, targetIsActive: true }),
    hasBlockBetween: async () => false,
    createBlock: async () => {},
    deleteInteractionsBetween: async () => {},
    saveInteraction: async () => {},
    ...overrides,
  };
}

describe('InteractionTargetParamsSchema', () => {
  it('accepts a UUID target ID', () => {
    assert.equal(InteractionTargetParamsSchema.safeParse({ targetId }).success, true);
  });

  it('rejects invalid target IDs', () => {
    assert.equal(
      InteractionTargetParamsSchema.safeParse({ targetId: 'not-a-uuid' }).success,
      false
    );
  });
});

describe('InteractionRepository', () => {
  it('loads actor and target eligibility in a single profile query', async () => {
    const profileQueries: unknown[] = [];
    const repository = createPrismaInteractionRepository({
      profile: {
        findMany: async (query: unknown) => {
          profileQueries.push(query);
          return [
            {
              studentId: actorId,
              visibility: 'CON_HOAT_DONG',
              student: { accountStatus: 'HOAT_DONG' },
            },
            {
              studentId: targetId,
              visibility: 'CON_HOAT_DONG',
              student: { accountStatus: 'HOAT_DONG' },
            },
          ];
        },
      },
    } as unknown as PrismaClient);

    assert.deepEqual(await repository.getActionEligibility(actorId, targetId), {
      actorExists: true,
      targetIsActive: true,
    });
    assert.equal(profileQueries.length, 1);
  });

});

describe('InteractionController', () => {
  it('maps each endpoint to its interaction action using the target ID from the URL', async () => {
    const calls: Array<{ method: string; actorId: string; targetId: string }> = [];
    const responses: unknown[] = [];
    const createAction =
      (method: string, action: string) =>
      async (actorId: string, actionTargetId: string) => {
        calls.push({ method, actorId, targetId: actionTargetId });
        return { action };
      };
    const controller = createInteractionController({
      likeInteraction: createAction('like', 'THICH'),
      skipInteraction: createAction('skip', 'BO_QUA'),
      blockInteraction: createAction('block', 'CHAN'),
    });
    const req = { params: { targetId }, user: { id: actorId } } as Request;
    const res = {
      status: () => res,
      json: (body: unknown) => {
        responses.push(body);
        return res;
      },
    } as Response;
    const next = (error?: unknown) => {
      if (error) {
        throw error;
      }
    };

    await controller.like(req, res, next);
    await controller.skip(req, res, next);
    await controller.block(req, res, next);

    assert.deepEqual(calls, [
      { method: 'like', actorId, targetId },
      { method: 'skip', actorId, targetId },
      { method: 'block', actorId, targetId },
    ]);
    assert.deepEqual(responses[0], {
      status: 'success',
      data: { action: 'THICH' },
    });
  });
});

describe('InteractionService', () => {
  it('logs likes with the Interaction service source and both participant IDs', async () => {
    const service = createInteractionService(createInteractionRepositoryStub());

    const logs = await captureInfoLogs(async () => {
      await service.like(actorId, targetId);
    });

    assert.deepEqual(logs, [{
      message: '[Interaction Service] Like created success',
      metadata: {
        action: 'interaction.like.created',
        actorId,
        targetId,
      },
    }]);
  });

  it('rejects interacting with the actor profile', async () => {
    let repositoryWasCalled = false;
    const service = createInteractionService(
      createInteractionRepositoryStub({
        getActionEligibility: async () => {
          repositoryWasCalled = true;
          return { actorExists: true, targetIsActive: true };
        },
      })
    );

    await assert.rejects(
      () => service.like(actorId, actorId),
      (error: unknown) => error instanceof AppError && error.statusCode === 422
    );
    assert.equal(repositoryWasCalled, false);
  });

  it('publishes the matching event only after saving the like and returns no match result', async () => {
    const callOrder: string[] = [];
    const eventBus = new EventBus<InteractionEvents>();
    const publishedEvents: Array<{ actorId: string; targetId: string }> = [];
    eventBus.subscribe('interaction.like-created', (event) => {
      callOrder.push('publish-event');
      publishedEvents.push(event);
    });
    const service = createInteractionService(
      createInteractionRepositoryStub({
        saveInteraction: async () => {
          callOrder.push('save-like');
        },
      }),
      eventBus
    );

    assert.deepEqual(
      await service.like(actorId, targetId),
      { action: 'THICH' }
    );
    assert.deepEqual(callOrder, ['save-like', 'publish-event']);
    assert.deepEqual(publishedEvents, [{ actorId, targetId }]);
  });

  it('maps unavailable and blocked outcomes to API errors', async () => {
    const unavailableService = createInteractionService(
      createInteractionRepositoryStub({
        getActionEligibility: async () => ({ actorExists: true, targetIsActive: false }),
      })
    );
    const blockedService = createInteractionService(
      createInteractionRepositoryStub({ hasBlockBetween: async () => true })
    );

    await assert.rejects(
      () => unavailableService.skip(actorId, targetId),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
    await assert.rejects(
      () => blockedService.like(actorId, targetId),
      (error: unknown) => error instanceof AppError && error.statusCode === 409
    );
  });

  it('creates a block, removes both interactions, and closes any active match', async () => {
    const callOrder: string[] = [];
    const service = createInteractionService(
      createInteractionRepositoryStub({
        createBlock: async () => {
          callOrder.push('create-block');
        },
        deleteInteractionsBetween: async () => {
          callOrder.push('delete-interactions');
        },
      }),
      undefined,
      {
        cancelMatch: async () => {
          callOrder.push('cancel-match');
        },
      }
    );

    assert.deepEqual(await service.block(actorId, targetId), {
      action: 'CHAN',
      matched: false,
      matchId: null,
    });
    assert.deepEqual(callOrder, [
      'create-block',
      'delete-interactions',
      'cancel-match',
    ]);
  });
});
