import { EventBus } from './event-bus.js';

export interface LikeCreatedEvent {
  actorId: string;
  targetId: string;
}

export interface InteractionEvents {
  'interaction.like-created': LikeCreatedEvent;
}

export const interactionEventBus = new EventBus<InteractionEvents>();
