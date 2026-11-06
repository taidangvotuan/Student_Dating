# Student Dating

Student Dating is a backend application for a student-focused dating platform.

## Tools and SDKs

| Tool / SDK | Purpose |
|------------|---------|
| Node.js 22+ and npm | Runtime and package management |
| TypeScript and Express | Typed application code and HTTP server |
| Supabase JavaScript SDK | Server-side authentication verification |
| Prisma | PostgreSQL data access |

## Run locally

Prerequisites: Node.js 22+, npm, and configured Supabase, PostgreSQL, and Redis services.

1. Install dependencies and create your local environment file:

   ```sh
   npm install
   ```

2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_DATABASE_URL`, and `REDIS_URL` in `.env`. Redis is required for the Socket.IO Redis adapter; the application does not start without it. Use credentials for your own Supabase project; never commit `.env` or expose the service role key to clients.

3. Generate the Prisma client and start the development server:

   ```sh
   npm run prisma:generate
   npm run dev
   ```

The server runs at `http://localhost:3000`. For production, run `npm run build` followed by `npm start`.