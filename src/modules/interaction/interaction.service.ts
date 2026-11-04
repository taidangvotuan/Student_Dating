import { InteractionKind } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import {
  interactionRepository,
  type InteractionRepository,
} from './interaction.repository.js';

export function createInteractionService(repository: InteractionRepository) {
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

  // Save the like first; a reciprocal like then creates the match and its conversation.
  async function like(actorId: string, targetId: string) {
    await validateProfiles(actorId, targetId);
    await ensureNotBlocked(actorId, targetId);

    await repository.saveInteraction(actorId, targetId, InteractionKind.THICH);

    const reciprocalKind = await repository.getInteractionKind(targetId, actorId);
    if (reciprocalKind !== InteractionKind.THICH) {
      return { action: 'THICH' as const, matched: false, matchId: null };
    }

    const matchId = await repository.createOrReactivateMatch(actorId, targetId);
    await repository.ensureConversation(matchId);
    return { action: 'THICH' as const, matched: true, matchId };
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
    await repository.cancelMatchAndDeactivateConversation(actorId, targetId);

    return { action: 'CHAN' as const, matched: false, matchId: null };
  }

  return { like, skip, block };
}

const interactionService = createInteractionService(interactionRepository);

export const likeInteraction = interactionService.like;
export const skipInteraction = interactionService.skip;
export const blockInteraction = interactionService.block;
