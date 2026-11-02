# Backend Architecture — Student Dating

## Modules


### `modules/profile`

The only feature module. Responsible for reading and updating the authenticated user's profile, interests, and search preferences.

| File | Responsibility |
|------|----------------|
| `profile.router.ts` | Declares routes, applies `authenticate` middleware to all routes |
| `profile.controller.ts` | Parses and validates requests via Zod, shapes HTTP responses |
| `profile.service.ts` | Executes Prisma queries, enforces ownership (`student_id`) |
| `profile.schemas.ts` | Zod schemas for all request bodies |

### `database`

`prisma.ts` exports a singleton `PrismaClient` configured with `?pgbouncer=true` appended to `DATABASE_URL` to be compatible with Supabase's PgBouncer transaction pooler.

### `supabase`

`client.ts` exports a single `supabaseAdmin` instance created with the `SUPABASE_SERVICE_ROLE_KEY`. This client is used exclusively by the `authenticate` middleware for server-side JWT verification and is never exposed to clients.

---

## Authentication

The backend **does not handle signup or login**. All user authentication is managed by Supabase Auth on the frontend.

### How it works

Every protected route requires a valid Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

The `authenticate` middleware in `src/shared/middleware/authenticate.ts` runs before every `/api/profile` handler:

```
Request
  → Extract Bearer token from Authorization header
  → supabaseAdmin.auth.getUser(token)     # server-side Supabase round-trip
  → Attach user to res.locals.user
  → next()
  OR
  → next(new AppError(401, "Unauthorized"))
```

### Token source

Tokens are issued by Supabase after the frontend calls `supabase.auth.signUp()` or any `supabase.auth.signIn*()` method. The current session token is available via `supabase.auth.getSession()`.

### Ownership enforcement

The JWT `sub` field (Supabase user UUID) is matched against `students.auth_id` inside the service layer. All mutating queries filter by the resolved `student_id`, so users can only read and modify their own profile.
