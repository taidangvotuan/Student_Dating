# Student Dating — Backend API

A Node.js/Express REST API for the Student Dating platform. Authentication is handled entirely by **Supabase Auth**; the backend verifies JWTs and exposes profile management endpoints.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 22 |
| npm | ≥ 10 |
| Supabase project | active |
| PostgreSQL | via Supabase |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd Student_Dating
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project values:

```env
PORT=3000
LOG_LEVEL=info

# Supabase connection pooler (PgBouncer)
DB_HOST=aws-0-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.<your-project-ref>
DB_PASSWORD=<your-db-password>

DATABASE_URL="postgresql://postgres.<your-project-ref>:<your-db-password>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase project
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Never commit `.env`** — it contains secrets. The `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only.

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Apply database migrations

Migrations live in `supabase/migrations/`. Apply them via the Supabase dashboard SQL editor or Supabase CLI:

```bash
# Using Supabase CLI
supabase db push

# Or paste each .sql file into Supabase Dashboard → SQL Editor
```

> The migration `20261102000000_auth_profile_triggers.sql` installs the PostgreSQL trigger functions that auto-create student profiles on signup. It must be applied before any signups are tested.

---

## Running the App

### Development (hot reload via tsx)

```bash
npm run dev
```

Server starts at `http://localhost:3000`. No compile step needed.

### Production

```bash
npm run build   # compile TypeScript → dist/
npm start       # run compiled output
```

---

## Building

```bash
npm run build
```

Compiles TypeScript to `dist/` using `tsc`. Output uses ESM (`NodeNext`).

---

## Testing

```bash
npm test
```

Runs all `test/*.test.ts` files using the Node.js native test runner with `tsx`. No live database connection required — Supabase and Prisma are mocked.

**Test files:**

| File | Coverage |
|------|----------|
| `test/authenticate.test.ts` | JWT middleware (valid, missing, invalid, malformed header) |
| `test/profile.test.ts` | Profile controller and service logic |

### Verify database connectivity

```bash
npm run db:check
```

Live check against both Supabase Auth and PostgreSQL. Requires `.env` to be configured.

---

## Prisma Commands

```bash
npm run prisma:generate   # regenerate Prisma client after schema changes
npm run prisma:validate   # validate prisma/schema.prisma
npm run prisma:migrate    # create and apply a migration (dev only)
npm run db:push           # push schema changes without a migration file
npm run prisma:studio     # open Prisma Studio GUI
```

---

## Health Checks

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /` | None | Welcome message |
| `GET /health` | None | Config sanity check (no network) |
| `GET /api/supabase/status` | None | Live Supabase connectivity |
| `GET /api/prisma/status` | None | Live PostgreSQL connectivity |

---

## npm Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run production build |
| `npm test` | Run full test suite |
| `npm run db:check` | Live DB connectivity check |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:validate` | Validate Prisma schema |
| `npm run prisma:migrate` | Create and apply a migration |
| `npm run db:push` | Push schema without a migration file |
| `npm run prisma:studio` | Open Prisma Studio |
