import { createServer, type AddressInfo } from 'node:http';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { io as createSocketClient, type Socket as ClientSocket } from 'socket.io-client';
import {
  createRealtimeTestServer,
} from '../src/shared/realtime/realtime.server.js';
import { getRedisUrl } from '../src/redis/redis.client.js';

const userA = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const userB = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function connect(client: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
    client.connect();
  });
}

describe('Realtime WebSocket', () => {
  it('requires a valid Redis URL', () => {
    assert.throws(() => getRedisUrl(undefined), /REDIS_URL is required/);
    assert.throws(() => getRedisUrl('https://localhost:6379'), /valid Redis or Redis TLS URL/);
    assert.equal(getRedisUrl(' rediss://localhost:6379 '), 'rediss://localhost:6379');
  });

  it('authenticates connections and only delivers events to server-assigned user rooms', async () => {
    const httpServer = createServer();
    const { io, publisher } = createRealtimeTestServer(
      httpServer,
      async (token) => {
        if (token === 'user-a-token') return userA;
        if (token === 'user-b-token') return userB;
        return null;
      }
    );
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address() as AddressInfo;
    const endpoint = `http://127.0.0.1:${address.port}`;
    const clientA = createSocketClient(endpoint, {
      auth: { accessToken: 'user-a-token' },
      transports: ['websocket'],
      reconnection: false,
    });
    const clientB = createSocketClient(endpoint, {
      auth: { accessToken: 'user-b-token' },
      transports: ['websocket'],
      reconnection: false,
    });
    const rejectedClient = createSocketClient(endpoint, {
      auth: { accessToken: 'invalid-token' },
      transports: ['websocket'],
      reconnection: false,
    });

    try {
      await Promise.all([connect(clientA), connect(clientB)]);
      const rejected = new Promise<Error>((resolve) => {
        rejectedClient.once('connect_error', resolve);
        rejectedClient.connect();
      });

      const delivered = new Promise<unknown>((resolve) => {
        clientB.once('matching.match.created', resolve);
      });
      const readReceipt = new Promise<unknown>((resolve) => {
        clientB.once('chat.conversation.read', resolve);
      });
      const deletion = new Promise<unknown>((resolve) => {
        clientB.once('chat.message.deleted', resolve);
      });
      let receivedByA = false;
      clientA.on('matching.match.created', () => {
        receivedByA = true;
      });
      clientA.on('chat.conversation.read', () => {
        receivedByA = true;
      });
      clientA.on('chat.message.deleted', () => {
        receivedByA = true;
      });
      publisher.publishToUsers([userB], {
        name: 'matching.match.created',
        payload: { matchId: 'match-id' },
      });
      publisher.publishToUsers([userB], {
        name: 'chat.conversation.read',
        payload: {
          conversationId: 'conversation-id',
          readerId: userA,
          lastReadAt: '2026-01-02T00:00:00.000Z',
        },
      });
      publisher.publishToUsers([userB], {
        name: 'chat.message.deleted',
        payload: {
          messageId: 'message-id',
          conversationId: 'conversation-id',
          deletedById: userA,
          deletedAt: '2026-01-02T00:00:00.000Z',
        },
      });

      assert.deepEqual(await delivered, { matchId: 'match-id' });
      assert.deepEqual(await readReceipt, {
        conversationId: 'conversation-id',
        readerId: userA,
        lastReadAt: '2026-01-02T00:00:00.000Z',
      });
      assert.deepEqual(await deletion, {
        messageId: 'message-id',
        conversationId: 'conversation-id',
        deletedById: userA,
        deletedAt: '2026-01-02T00:00:00.000Z',
      });
      assert.equal((await rejected).message, 'Unauthorized');
      assert.equal(receivedByA, false);
    } finally {
      clientA.disconnect();
      clientB.disconnect();
      rejectedClient.disconnect();
      await new Promise<void>((resolve) => io.close(() => resolve()));
    }
  });
});
