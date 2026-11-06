# Socket.IO Realtime Events

This document describes the server-to-client Socket.IO events for the Student
Dating frontend. Message writes and read/delete actions still use the REST API;
Socket.IO delivers updates to connected participants.

## Connect and authenticate

Install the Socket.IO client if it is not already part of the frontend:

```sh
npm install socket.io-client
```

Connect to the API origin and pass the current Supabase access token in the
Socket.IO `auth` payload:

```ts
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  auth: { accessToken: session.access_token },
});
```

The server verifies the token and assigns the connection to a server-managed
user room. Do not send a user ID or room name: clients cannot select rooms.
An invalid or missing token rejects the connection with a `connect_error`
whose message is `Unauthorized`.

Socket.IO reconnects automatically by default. After each `connect` event,
reload the current conversation and its messages through REST because events
sent while disconnected are not queued or replayed:

```ts
socket.on('connect', () => {
  void refreshConversationAndMessages();
});

socket.on('connect_error', (error) => {
  console.error('Realtime connection failed:', error.message);
});
```

## Event summary

All event payloads are passed directly to the listener as the single argument;
there is no additional `{ event, data }` envelope. Timestamp fields are ISO
8601 strings in UTC.

| Event | Sent to | Emitted when |
|---|---|---|
| `chat.message.created` | Other conversation participant | A message has been persisted by the send-message REST endpoint. |
| `chat.message.deleted` | Other conversation participant | A message has been successfully deleted by its author. Repeating a delete does not emit another event. |
| `chat.conversation.read` | Other conversation participant | A participant's read marker has been saved. This is a conversation-level receipt, not a list of message IDs. |
| `matching.match.created` | Both matched participants | The match is created/reactivated and its conversation is activated. |
| `matching.match.cancelled` | Both participants | One or more matches are cancelled. |

The sender does not receive their own message-created event; the REST response
contains the newly created message. Read and delete actions are also returned
by their REST responses to the acting user.

## Chat event payloads

### `chat.message.created`

```ts
socket.on('chat.message.created', (message) => {
  // Upsert by message.id to avoid duplicates in the current conversation.
});
```

```json
{
  "id": "message-uuid",
  "conversationId": "conversation-uuid",
  "senderId": "student-uuid",
  "body": "Hello!",
  "status": "DA_GUI",
  "sentAt": "2026-11-06T09:00:00.000Z",
  "deletedAt": null
}
```

### `chat.message.deleted`

The recipient can replace the matching message with a tombstone (`body: null`,
`status: "DA_XOA"`) or refresh the conversation history.

```json
{
  "messageId": "message-uuid",
  "conversationId": "conversation-uuid",
  "deletedById": "student-uuid",
  "deletedAt": "2026-11-06T09:05:00.000Z"
}
```

### `chat.conversation.read`

This receipt reports the reader and the server timestamp of the updated
conversation read marker. It does not identify individual messages.

```json
{
  "conversationId": "conversation-uuid",
  "readerId": "student-uuid",
  "lastReadAt": "2026-11-06T09:10:00.000Z"
}
```

## Match event payloads

### `matching.match.created`

```json
{
  "matchId": "match-uuid"
}
```

Use the existing conversation-list REST endpoint to load the new conversation
and participant details.

### `matching.match.cancelled`

```json
{
  "matchIds": ["match-uuid"]
}
```

Refresh the affected conversations through REST to get their current status.

## REST operations and recovery

Socket.IO is server-to-client only; do not emit chat commands from the client.
Use these existing endpoints for state changes and history:

| Action | REST endpoint |
|---|---|
| Load conversations | `GET /api/chat` |
| Load conversation history | `GET /api/chat/:conversationId/messages` |
| Send a message | `POST /api/chat/:conversationId/messages` |
| Delete a message | `DELETE /api/chat/:conversationId/messages/:messageId` |
| Mark conversation read | `PUT /api/chat/:conversationId/read` |

Include `Authorization: Bearer <supabase_access_token>` on protected REST calls.
On reconnect, refresh relevant data via REST; realtime delivery is best-effort
and has no event IDs, acknowledgements, or offline replay.

For REST request/response details, see the [Chat Endpoints in the API
reference](api/API.md#chat-endpoints).
