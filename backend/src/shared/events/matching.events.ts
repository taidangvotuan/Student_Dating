import { EventBus } from './event-bus.js';

export interface MatchCreatedEvent {
  matchId: string;
  studentAId: string;
  studentBId: string;
}

export interface MatchCancelledEvent {
  matchIds: readonly string[];
  firstStudentId: string;
  secondStudentId: string;
}

export interface MatchingEvents {
  'matching.match-created': MatchCreatedEvent;
  'matching.match-cancelled': MatchCancelledEvent;
}

export const matchingEventBus = new EventBus<MatchingEvents>();
