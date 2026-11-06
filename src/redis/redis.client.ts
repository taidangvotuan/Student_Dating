import { createClient, type RedisClientType } from 'redis';
import { logger } from '../shared/logger/logger.js';

export interface RedisClientPair {
  readonly publisher: RedisClientType;
  readonly subscriber: RedisClientType;
  close(): Promise<void>;
}

export function getRedisUrl(value: string | undefined = process.env.REDIS_URL): string {
  const redisUrl = value?.trim();
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for realtime delivery.');
  }

  try {
    const parsedUrl = new URL(redisUrl);
    if (!['redis:', 'rediss:'].includes(parsedUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error('REDIS_URL must be a valid Redis or Redis TLS URL.');
  }

  return redisUrl;
}

export function createRedisClient(
  url: string = getRedisUrl(),
  role = 'client'
): RedisClientType {
  const client = createClient({ url });
  client.on('error', (error: Error) => {
    logger.error('[Redis] Client connection error', {
      role,
      error: error.message,
    });
  });
  return client;
}

export async function connectRedisClients(
  url: string = getRedisUrl()
): Promise<RedisClientPair> {
  const publisher = createRedisClient(url, 'publisher');
  const subscriber = publisher.duplicate();
  subscriber.on('error', (error: Error) => {
    logger.error('[Redis] Client connection error', {
      role: 'subscriber',
      error: error.message,
    });
  });

  try {
    await Promise.all([publisher.connect(), subscriber.connect()]);
  } catch (error) {
    await Promise.allSettled([
      ...(publisher.isOpen ? [publisher.quit()] : []),
      ...(subscriber.isOpen ? [subscriber.quit()] : []),
    ]);
    throw error;
  }

  let closed = false;
  return {
    publisher,
    subscriber,
    async close() {
      if (closed) return;
      closed = true;
      const results = await Promise.allSettled([
        publisher.quit(),
        subscriber.quit(),
      ]);
      const failures = results.flatMap((result) =>
        result.status === 'rejected' ? [result.reason] : []
      );
      if (failures.length > 0) {
        throw new AggregateError(failures, 'Failed to close Redis clients.');
      }
    },
  };
}
