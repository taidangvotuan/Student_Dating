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
import type { RealtimePublisher } from '../../shared/realtime/realtime.events.js';
import { publishRealtimeEvent } from '../../shared/realtime/realtime.publisher.js';
import type { EventBus } from '../../shared/events/event-bus.js';
import {
  matchingEventBus,
  type MatchingEvents,
} from '../../shared/events/matching.events.js';

export interface MatchingService {
  handleLikeCreated(event: LikeCreatedEvent): Promise<boolean>;
  cancelMatch(firstStudentId: string, secondStudentId: string): Promise<void>;
}

export function createMatchingService(
  repository: MatchingRepository,
  chat: ChatLifecycle = { activateConversation, deactivateConversations },
  publisher: RealtimePublisher = { publishToUsers: publishRealtimeEvent },
  eventBus: EventBus<MatchingEvents> = matchingEventBus
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
    try {
      publisher.publishToUsers([actorId, targetId], {
        name: 'matching.match.created',
        payload: { matchId },
      });
    } catch (error) {
      logger.error('[Matching Service] Realtime match delivery failed', {
        action: 'matching.match.delivery.failed',
        actorId,
        targetId,
        matchId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    logger.info('[Matching Service] Handle like created success', {
      action: 'matching.match.created_or_reactivated',
      actorId,
      targetId,
      matchId,
      matched: true,
    });

    eventBus.publish('matching.match-created', {
      matchId,
      studentAId: actorId,
      studentBId: targetId,
    });

    return true;
  }

  async function cancelMatch(
    firstStudentId: string,
    secondStudentId: string
  ): Promise<void> {
    const matchIds = await repository.cancelMatch(firstStudentId, secondStudentId);
    await chat.deactivateConversations(matchIds);
    if (matchIds.length > 0) {
      try {
        publisher.publishToUsers([firstStudentId, secondStudentId], {
          name: 'matching.match.cancelled',
          payload: { matchIds },
        });
      } catch (error) {
        logger.error('[Matching Service] Realtime match cancellation delivery failed', {
          action: 'matching.match.cancellation_delivery.failed',
          actorId: firstStudentId,
          targetId: secondStudentId,
          matchIds,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      eventBus.publish('matching.match-cancelled', {
        matchIds,
        firstStudentId,
        secondStudentId,
      });
    }
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
