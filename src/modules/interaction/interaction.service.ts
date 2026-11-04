import { InteractionKind } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import {
  interactionRepository,
  type InteractionRepository,
} from './interaction.repository.js';
import type { EventBus } from '../../shared/events/event-bus.js';
import {
  interactionEventBus,
  type InteractionEvents,
} from '../../shared/events/interaction.events.js';
import {
  cancelMatchAndDeactivateConversation,
  type MatchingService,
} from '../matching/matching.service.js';

export function createInteractionService(
  repository: InteractionRepository,
  eventBus: EventBus<InteractionEvents> = interactionEventBus,
  matching: Pick<MatchingService, 'cancelMatchAndDeactivateConversation'> = {
    cancelMatchAndDeactivateConversation,
  }
) {
  async function validateProfiles(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new AppError(422, 'You cannot interact with your own profile.');
    }

    const eligibility = await repository.getActionEligibility(actorId, targetId);
    if (!eligibility.actorExists) {
      throw new AppError(404, 'Profile not found.');
    }

    if (!eligibility.targetIsActive) {
      throw new AppError(404, 'Target profile not found or unavailable.');
    }
  }

  async function ensureNotBlocked(actorId: string, targetId: string) {
    if (await repository.hasBlockBetween(actorId, targetId)) {
      throw new AppError(409, 'Interaction is not allowed because one profile has blocked the other.');
    }
  }

  // Persist the like before publishing; matching runs asynchronously and does not affect this response.
  async function like(actorId: string, targetId: string) {
    await validateProfiles(actorId, targetId);
    await ensureNotBlocked(actorId, targetId);

    await repository.saveInteraction(actorId, targetId, InteractionKind.THICH);
    eventBus.publish('interaction.like-created', { actorId, targetId });
    return { action: 'THICH' as const };
  }

  // A skip records the decision without checking for or creating a match.
  async function skip(actorId: string, targetId: string) {
    await validateProfiles(actorId, targetId);
    await ensureNotBlocked(actorId, targetId);

    await repository.saveInteraction(actorId, targetId, InteractionKind.BO_QUA);
    return { action: 'BO_QUA' as const, matched: false, matchId: null };
  }

  // Persist the block, clear both users' interactions, then close any existing match.
  async function block(actorId: string, targetId: string) {
    await validateProfiles(actorId, targetId);
    await repository.createBlock(actorId, targetId);
    await repository.deleteInteractionsBetween(actorId, targetId);

    await matching.cancelMatchAndDeactivateConversation(actorId, targetId);

    return { action: 'CHAN' as const, matched: false, matchId: null };
  }

  return { like, skip, block };
}

const interactionService = createInteractionService(interactionRepository);

export const likeInteraction = interactionService.like;
export const skipInteraction = interactionService.skip;
export const blockInteraction = interactionService.block;
