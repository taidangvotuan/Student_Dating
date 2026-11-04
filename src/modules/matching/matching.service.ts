import type { LikeCreatedEvent } from '../../shared/events/interaction.events.js';
import {
  matchingRepository,
  type MatchingRepository,
} from './matching.repository.js';

export interface MatchingService {
  handleLikeCreated(event: LikeCreatedEvent): Promise<boolean>;
  cancelMatchAndDeactivateConversation(firstStudentId: string, secondStudentId: string): Promise<void>;
}

export function createMatchingService(repository: MatchingRepository) {
  async function handleLikeCreated({ actorId, targetId }: LikeCreatedEvent): Promise<boolean> {
    if (!(await repository.areAccountsActive(actorId, targetId))) {
      return false;
    }

    const [hasBlock, hasReciprocalLike] = await Promise.all([
      repository.hasBlockBetween(actorId, targetId),
      repository.hasReciprocalLike(actorId, targetId),
    ]);
    if (hasBlock || !hasReciprocalLike) {
      return false;
    }

    await repository.createOrReactivateMatch(actorId, targetId);

    // Future chat integration: create an empty conversation for this match.
    // Future notification integration: notify both users that they matched.
    return true;
  }

  async function cancelMatchAndDeactivateConversation(
    firstStudentId: string,
    secondStudentId: string
  ): Promise<void> {
    await repository.cancelMatchAndDeactivateConversation(firstStudentId, secondStudentId);
  }

  return { handleLikeCreated, cancelMatchAndDeactivateConversation };
}

const matchingService = createMatchingService(matchingRepository);
export const handleLikeCreated = matchingService.handleLikeCreated;
export const cancelMatchAndDeactivateConversation = matchingService.cancelMatchAndDeactivateConversation;
