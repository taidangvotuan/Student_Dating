# Backend Architecture — Student Dating

## Modules


### `modules/profile`

Responsible for reading and updating the authenticated user's profile, interests, and search preferences.

| File | Responsibility |
|------|----------------|
| `profile.router.ts` | Declares routes, applies `authenticate` middleware to all routes |
| `profile.controller.ts` | Parses and validates requests via Zod, shapes HTTP responses |
| `profile.service.ts` | Applies profile business rules and ownership enforcement |
| `profile.schemas.ts` | Zod schemas for all request bodies |

### `modules/discovery`

Responsible for retrieving eligible profiles for the authenticated user, applying configured search preferences and excluding profiles that should not appear (for example, interacted, blocked, or already matched profiles).

### `modules/interaction`

Responsible for the authenticated user's like, skip, and block actions. A like publishes `interaction.like-created`; a block clears interactions between the pair and requests match cancellation from Matching.

Interaction does not determine mutual likes or create matches. Match processing happens asynchronously and is separate from the like action's response.

### `modules/matching`

Owns match eligibility and match persistence. The event listener delegates to the matching service, which checks that both accounts are active, that neither user blocked the other, and that a reciprocal like exists. The matching repository creates/reactivates or cancels the canonical student pair and returns affected match IDs. Matching then calls Chat's lifecycle operations. Structured application logs record match outcomes and involved user/match IDs.

### `modules/chat`

Owns conversation and message persistence, including creating/reactivating a conversation for a match and deactivating conversations for canceled matches. Structured application logs record user-facing conversation and message actions using actor/resource IDs, never message contents. Each lifecycle change is a single idempotent database operation; Matching no longer writes conversation records or wraps match and conversation writes in one transaction. Multi-step chat operations retain transactions where they protect consistency. Chat publishes live message events after successful persistence.

### `modules/notification`

Responsible for persistent in-app notifications. Follows a normalized 2-table model separating shared notification events (`notifications`) from per-user delivery state (`notification_recipients`).
Guarantees three architectural requirements:
1. **Zero static text in DB**: Titles and messages are dynamically formatted on read based on requested locale (`vi` / `en`) and referenced entity profiles.
2. **Rich relational IDs**: Carries direct foreign keys and references (`matchId`, `conversationId`, `actorId`) for instant deep-linking.
3. **Mutual notification support**: A single match event row is shared between both participants while tracking read/dismiss states independently.

Provides endpoints to list notifications with cursor pagination, fetch unread badge counts, mark single or all notifications read, and dismiss individual inbox items.

### `shared/events`

Provides the generic in-process `EventBus<Events>` (`publish`/`subscribe`) and shared event contracts:
- `interaction.events.ts`: `interaction.like-created` published by Interaction; Matching subscribes to it to determine mutual matches.
- `matching.events.ts`: `matching.match-created` and `matching.match-cancelled` published by Matching; Notification subscribes to it via `notification.listener.ts` to create persistent mutual notifications.

The shared layer transports events only and contains no business logic. Event delivery is process-local and non-durable: events can be lost on process failure and are not distributed across application instances. Both matching and notification listeners are initialized once during application startup.

### Realtime delivery

Socket.IO shares the application's HTTP server and uses the Redis adapter for cross-instance fan-out. Redis must be configured and reachable before the application starts. Socket.IO authenticates the Supabase access token from the handshake `auth.accessToken` field and assigns each connection to a server-controlled user room; clients cannot choose rooms.

The REST API remains the only message-write path. After a successful message transaction, Chat emits `chat.message.created` to the other conversation participant. Marking a conversation read emits `chat.conversation.read` with the reader ID and timestamp; successfully deleting a message emits `chat.message.deleted` with the message ID and deletion details. Both are sent only to the other participant. Matching emits `matching.match.created` to both participants after activating a conversation, and `matching.match.cancelled` to both participants after cancellation. These events are transient and best-effort; clients recover missed updates by reloading existing REST resources after reconnecting.

### Module activity logging

Service action log messages use a source prefix and a concise operation plus outcome, for example `[Matching Service] Handle like created success` or `[Interaction Service] Like created success`. Failure messages use `failed`; structured metadata records the action and relevant actor/resource IDs, reason, and result counts. Logs exclude message bodies, verification rejection reasons, and profile field values.

---

## Authentication

The backend **does not handle signup or login**. All user authentication is managed by Supabase Auth on the frontend.

### How it works

Protected requests require a valid Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

The `authenticate` middleware in `src/shared/middleware/authenticate.ts` verifies the token server-side with Supabase Auth and attaches the verified user to `res.locals.user` before continuing to the module handler. Missing or invalid tokens result in an unauthorized error.

```
Request
  → Extract Bearer token from Authorization header
  → supabaseAdmin.auth.getUser(token)     # server-side Supabase round-trip
  → Attach user to res.locals.user
  → next()
  OR
  → next(new AppError(401, "Unauthorized"))
```

### Token lifecycle

Tokens are issued and managed by Supabase Auth. The frontend sends its current session token with protected requests.

### Identity and ownership

The verified identity is made available to protected modules through the request context. Modules enforce ownership so users can access or modify only their own resources.
