# Project Progress

_Last updated: 2026-11-02_

---

## Authentication

### JWT Middleware (`src/shared/middleware/authenticate.ts`)
- **Status: ✅ Complete**
- Extracts Bearer token from `Authorization` header.
- Verifies token server-side via `supabaseAdmin.auth.getUser(token)` (service role key, never client-facing).
- Attaches the resolved user to `res.locals.user` for downstream handlers.
- Returns `AppError(401)` on missing, invalid, or expired tokens.
- Covered by `test/authenticate.test.ts` — valid token, missing header, invalid token, malformed header.

### Supabase Admin Client (`src/supabase/supabase.ts`)
- **Status: ✅ Complete**
- Single `supabaseAdmin` instance using `SUPABASE_SERVICE_ROLE_KEY`.
- Used exclusively by the `authenticate` middleware; never returned in responses.

---

## Profile Module

### Implementation (`src/modules/profile/`)
- **Status: ✅ Complete**

| File | Status |
|------|--------|
| `profile.schemas.ts` | ✅ Zod schemas for all request bodies |
| `profile.service.ts` | ✅ Prisma queries with ownership enforcement (`student_id`) |
| `profile.controller.ts` | ✅ Request parsing, Zod validation, response shaping |
| `profile.router.ts` | ✅ Routes declared, `authenticate` middleware applied |

### Endpoints implemented

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/profile` | Get own profile + interests + preferences + verification |
| `PATCH` | `/api/profile` | Update own profile fields |
| `PUT` | `/api/profile/interests` | Replace own interest selections |
| `PUT` | `/api/profile/preferences` | Upsert own search preferences |
| `GET` | `/api/profile/interests` | List all active global interest tags |

---

## Discovery Module

### Implementation (`src/modules/discovery/`)
- **Status: ✅ Complete**
- Returns eligible profiles according to the authenticated user's search criteria.
- Excludes profiles that are unavailable, already interacted with, blocked, or already matched.
- Uses bounded pagination and a single feed query for the discovery results.

---

## Interaction Module

### Implementation (`src/modules/interaction/`)
- **Status: ✅ Complete**
- Provides separate authenticated actions for like, skip, and block, with `targetId` in the URL.
- Persists likes before publishing `interaction.like-created`; the successful like response reports the action only and does not wait for matching.
- Blocks clear interactions between the users and delegate match cancellation to Matching; Matching delegates conversation deactivation to Chat.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/interactions/:targetId/like` | Like a profile |
| `POST` | `/api/interactions/:targetId/skip` | Skip a profile |
| `POST` | `/api/interactions/:targetId/block` | Block a profile |

---

## Matching Module

### Implementation (`src/modules/matching/`)
- **Status: ✅ Complete**
- Handles `interaction.like-created` asynchronously through a listener initialized at application startup.
- Creates or reactivates a match only when both accounts are active, there is no block in either direction, and a reciprocal like exists.
- Owns match cancellation; Chat owns associated conversation lifecycle changes.
- Conversation creation/reactivation and deactivation are idempotent single writes in Chat, separate from match persistence; notifications remain a future responsibility.

### Chat Module (`src/modules/chat/`)
- **Status: ✅ REST API implemented; realtime pending**
- Provides participant-scoped conversation listing/details, paginated history, text sends, soft deletion, and read markers.
- Matching requests Chat to create/reactivate the unique conversation; inactive conversations retain readable history and reject new messages.

### Shared Event Bus (`src/shared/events/`)
- **Status: ✅ Complete**
- Provides a generic in-process `EventBus<Events>` and the shared interaction event contract.
- Event delivery is not durable and is limited to the current process; there is no retry or cross-instance delivery.

### Verification
- `npm test` — 57 tests passed.
- `npm run build` — passed.