import type { LikeCreatedEvent } from '../../shared/events/interaction.events.js';
import { logger } from '../../shared/logger/logger.js';
import {
  activateConversation,
  deactivateConversations,
  type ChatLifecycle,
} from '../chat/chat.service.js';
import {
  matchingRepository,
  type MatchingRepository,
} from './matching.repository.js';

export interface MatchingService {
  handleLikeCreated(event: LikeCreatedEvent): Promise<boolean>;
  cancelMatch(firstStudentId: string, secondStudentId: string): Promise<void>;
}

export function createMatchingService(
  repository: MatchingRepository,
  chat: ChatLifecycle = { activateConversation, deactivateConversations }
) {
  async function handleLikeCreated({ actorId, targetId }: LikeCreatedEvent): Promise<boolean> {
    if (!(await repository.areAccountsActive(actorId, targetId))) {
      logger.info('[Matching Service] Handle like created success', {
        action: 'matching.match.not_created',
        actorId,
        targetId,
        reason: 'inactive_account',
        matched: false,
      });
      return false;
    }

    const [hasBlock, hasReciprocalLike] = await Promise.all([
      repository.hasBlockBetween(actorId, targetId),
      repository.hasReciprocalLike(actorId, targetId),
    ]);
    if (hasBlock || !hasReciprocalLike) {
      logger.info('[Matching Service] Handle like created success', {
        action: 'matching.match.not_created',
        actorId,
        targetId,
        reason: hasBlock ? 'blocked_pair' : 'no_reciprocal_like',
        matched: false,
      });
      return false;
    }

    const matchId = await repository.createOrReactivateMatch(actorId, targetId);
    await chat.activateConversation(matchId);
    logger.info('[Matching Service] Handle like created success', {
      action: 'matching.match.created_or_reactivated',
      actorId,
      targetId,
      matchId,
      matched: true,
    });

    // Future notification integration: notify both users that they matched.
    return true;
  }

  async function cancelMatch(
    firstStudentId: string,
    secondStudentId: string
  ): Promise<void> {
    const matchIds = await repository.cancelMatch(firstStudentId, secondStudentId);
    await chat.deactivateConversations(matchIds);
    logger.info('[Matching Service] Cancel match success', {
      action: 'matching.match.cancelled',
      actorId: firstStudentId,
      targetId: secondStudentId,
      matchIds,
      count: matchIds.length,
    });
  }

  return { handleLikeCreated, cancelMatch };
}

const matchingService = createMatchingService(matchingRepository);
export const handleLikeCreated = matchingService.handleLikeCreated;
export const cancelMatch = matchingService.cancelMatch;
