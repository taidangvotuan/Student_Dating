import type { RealtimeEvent, RealtimePublisher } from './realtime.events.js';

let activePublisher: RealtimePublisher | undefined;

export function configureRealtimePublisher(publisher: RealtimePublisher): void {
  activePublisher = publisher;
}

export function publishRealtimeEvent(
  userIds: readonly string[],
  event: RealtimeEvent
): void {
  if (!activePublisher) {
    throw new Error('Realtime publisher has not been initialized.');
  }
  activePublisher.publishToUsers(userIds, event);
}
