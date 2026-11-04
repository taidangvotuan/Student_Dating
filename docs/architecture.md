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

Responsible for the authenticated user's like, skip, and block actions. A like publishes `interaction.like-created`; a block clears interactions between the pair and requests match/conversation deactivation from Matching.

Interaction does not determine mutual likes or create matches. Match processing happens asynchronously and is separate from the like action's response.

### `modules/matching`

Owns match eligibility and lifecycle. The event listener delegates to the matching service, which checks that both accounts are active, that neither user blocked the other, and that a reciprocal like exists. The matching repository creates or reactivates the canonical student pair. It also owns match cancellation and associated conversation deactivation, invoked by Interaction when a user blocks the other.

Matching does not create conversations or send notifications; those remain future responsibilities of chat and notification modules.

### `shared/events`

Provides the generic in-process `EventBus<Events>` (`publish`/`subscribe`) and the shared interaction event contract. Interaction publishes `interaction.like-created` after saving a like; Matching subscribes to it. The shared layer transports events only and contains no matching or interaction business logic.

Event delivery is process-local and non-durable: events can be lost on process failure and are not distributed across application instances. The matching listener is initialized once during application startup.

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
