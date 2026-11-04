import { logger } from '../../shared/logger/logger.js';
import type { EventBus } from '../../shared/events/event-bus.js';
import {
  type LikeCreatedEvent,
  interactionEventBus,
  type InteractionEvents,
} from '../../shared/events/interaction.events.js';
import {
  handleLikeCreated,
  type MatchingService,
} from './matching.service.js';

export function registerMatchingListener(
  eventBus: EventBus<InteractionEvents> = interactionEventBus,
  service: Pick<MatchingService, 'handleLikeCreated'> = { handleLikeCreated },
  reportError: (event: LikeCreatedEvent, error: unknown) => void = (
    event,
    error
  ) => {
    logger.error('Failed to process interaction.like-created event', {
      actorId: event.actorId,
      targetId: event.targetId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
): () => void {
  return eventBus.subscribe('interaction.like-created', (event) => {
    void service.handleLikeCreated(event).catch((error: unknown) => {
      reportError(event, error);
    });
  });
}

let unregisterMatchingListener: (() => void) | undefined;

export function initializeMatchingModule(): void {
  if (unregisterMatchingListener) {
    return;
  }
  unregisterMatchingListener = registerMatchingListener();
}
