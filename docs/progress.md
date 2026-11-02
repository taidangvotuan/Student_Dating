# Project Progress

_Last updated: 2026-11-02_

---

## Database

### Schema (`supabase/migrations/20261031000000_initial_student_dating.sql`)
- **Status: ✅ Complete**
- Full schema defined and applied to Supabase PostgreSQL.
- Tables: `students`, `profiles`, `verifications`, `interests`, `profile_interests`, `preferences`, `matches`, `conversations`, `messages`.
- Row-Level Security (RLS) policies enabled on all `public.*` tables.
- Enums: `AccountStatus`, `ProfileVisibility`, `VerificationStatus`, `InteractionKind`, `MatchStatus`, `ConversationStatus`, `MessageStatus`.

---

## Prisma

### ORM Setup (`prisma/schema.prisma`, `src/database/prisma.ts`)
- **Status: ✅ Complete**
- Prisma 6 configured with Supabase connection pooler (PgBouncer).
- `DATABASE_URL` includes `?pgbouncer=true` to prevent prepared statement conflicts on the transaction pooler.
- Singleton `PrismaClient` exported from `src/database/prisma.ts`.
- All public schema tables modelled in `prisma/schema.prisma`.
- Prisma client generated and validated.

### Scripts available
| Script | Command |
|--------|---------|
| Generate client | `npm run prisma:generate` |
| Validate schema | `npm run prisma:validate` |
| Create migration | `npm run prisma:migrate` |
| Push schema | `npm run db:push` |
| Prisma Studio | `npm run prisma:studio` |

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

## Authentication Triggers

### Migration (`supabase/migrations/20261102000000_auth_profile_triggers.sql`)
- **Status: ✅ Complete — applied to live database**

Two PostgreSQL trigger functions on `auth.users`:

#### `validate_auth_user_signup` (BEFORE INSERT)
Rejects signup with `P0001` exception if any condition fails:
- [x] Email must end with `.edu.vn`
- [x] `fullname` metadata must be non-empty
- [x] `birthday` metadata must be present, valid `YYYY-MM-DD` format, and in the past

#### `handle_new_auth_user` (AFTER INSERT)
On successful signup, automatically creates:
- [x] `public.students` row — `student_id` extracted from first 8 characters of email, `accountStatus = HOAT_DONG`
- [x] `public.profiles` row — populated with `fullname`, `birthday`, `gender`, `faculty`, `cohort` from signup metadata
- [x] `public.verifications` row — `status = CHUA_XAC_THUC`

Both triggers are live and verified on the Supabase project.

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