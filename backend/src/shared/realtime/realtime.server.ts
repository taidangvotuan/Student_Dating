import type { Server as HttpServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, type Server as SocketServer } from 'socket.io';
import { z } from 'zod';
import { logger } from '../logger/logger.js';
import { supabaseAdmin } from '../../supabase/supabase.js';
import { connectRedisClients } from '../../redis/redis.client.js';
import type { RealtimeEvent, RealtimePublisher } from './realtime.events.js';

const SocketAuthSchema = z.object({
  accessToken: z.string().min(1).max(8192),
});

interface SocketData {
  userId: string;
}

interface ServerToClientEvents {
  'chat.message.created': (payload: Extract<RealtimeEvent, { name: 'chat.message.created' }>['payload']) => void;
  'chat.message.deleted': (payload: Extract<RealtimeEvent, { name: 'chat.message.deleted' }>['payload']) => void;
  'chat.conversation.read': (payload: Extract<RealtimeEvent, { name: 'chat.conversation.read' }>['payload']) => void;
  'matching.match.created': (payload: Extract<RealtimeEvent, { name: 'matching.match.created' }>['payload']) => void;
  'matching.match.cancelled': (payload: Extract<RealtimeEvent, { name: 'matching.match.cancelled' }>['payload']) => void;
}

type ClientToServerEvents = Record<never, never>;
type InterServerEvents = Record<never, never>;
type RealtimeSocketServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AccessTokenVerifier = (token: string) => Promise<string | null>;

export interface RealtimeRuntime {
  readonly publisher: RealtimePublisher;
  close(): Promise<void>;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export async function verifySupabaseAccessToken(token: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || typeof data?.claims?.sub !== 'string') {
    return null;
  }
  const userId = z.string().uuid().safeParse(data.claims.sub);
  return userId.success ? userId.data : null;
}

export function registerRealtimeHandlers(
  io: RealtimeSocketServer,
  verifyAccessToken: AccessTokenVerifier
): RealtimePublisher {
  io.use(async (socket, next) => {
    const auth = SocketAuthSchema.safeParse(socket.handshake.auth);
    if (!auth.success) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const userId = await verifyAccessToken(auth.data.accessToken);
      if (!userId || !z.string().uuid().safeParse(userId).success) {
        next(new Error('Unauthorized'));
        return;
      }
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    void Promise.resolve(socket.join(userRoom(socket.data.userId))).catch((error: unknown) => {
      logger.error('[Realtime] Failed to join authenticated user room', {
        userId: socket.data.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      socket.disconnect(true);
    });
  });

  return {
    publishToUsers(userIds, event) {
      if (userIds.length === 0) return;
      const destination = io.to(userIds.map(userRoom));
      switch (event.name) {
        case 'chat.message.created':
          destination.emit(event.name, event.payload);
          break;
        case 'chat.message.deleted':
          destination.emit(event.name, event.payload);
          break;
        case 'chat.conversation.read':
          destination.emit(event.name, event.payload);
          break;
        case 'matching.match.created':
          destination.emit(event.name, event.payload);
          break;
        case 'matching.match.cancelled':
          destination.emit(event.name, event.payload);
          break;
      }
    },
  };
}

export async function createRealtimeRuntime(
  httpServer: HttpServer,
  redisUrl: string,
  verifyAccessToken: AccessTokenVerifier = verifySupabaseAccessToken
): Promise<RealtimeRuntime> {
  const redisClients = await connectRedisClients(redisUrl);

  const io: RealtimeSocketServer = new Server(httpServer, {
    cors: { origin: '*' },
    maxHttpBufferSize: 16 * 1024,
  });
  io.adapter(createAdapter(redisClients.publisher, redisClients.subscriber));
  const publisher = registerRealtimeHandlers(io, verifyAccessToken);

  return {
    publisher,
    async close() {
      await new Promise<void>((resolve, reject) => {
        io.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await redisClients.close();
    },
  };
}

export function createRealtimeTestServer(
  httpServer: HttpServer,
  verifyAccessToken: AccessTokenVerifier
): { readonly io: RealtimeSocketServer; readonly publisher: RealtimePublisher } {
  const io: RealtimeSocketServer = new Server(httpServer, {
    cors: { origin: '*' },
    maxHttpBufferSize: 16 * 1024,
  });
  return { io, publisher: registerRealtimeHandlers(io, verifyAccessToken) };
}
