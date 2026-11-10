import { EventEmitter } from 'node:events';

type EventListener<Payload> = (payload: Payload) => void;

export class EventBus<Events extends object> {
  private readonly emitter = new EventEmitter();

  publish<EventName extends keyof Events>(eventName: EventName, payload: Events[EventName]): void {
    this.emitter.emit(eventName as string | symbol, payload);
  }

  subscribe<EventName extends keyof Events>(
    eventName: EventName,
    listener: EventListener<Events[EventName]>
  ): () => void {
    this.emitter.on(eventName as string | symbol, listener);
    return () => this.emitter.off(eventName as string | symbol, listener);
  }
}
