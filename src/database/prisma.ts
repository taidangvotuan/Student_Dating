import { PrismaClient } from '@prisma/client';

export {
  AccountStatus,
  VerificationStatus,
  ProfileVisibility,
  InteractionKind,
  MatchStatus,
  ConversationStatus,
  MessageStatus,
} from '@prisma/client';

export interface PrismaEnvironment {
  readonly DATABASE_URL?: string;
  readonly DB_USER?: string;
  readonly DB_PASSWORD?: string;
  readonly DB_HOST?: string;
  readonly DB_PORT?: string;
  readonly DB_NAME?: string;
}

/**
 * Resolves the PostgreSQL connection string either directly from DATABASE_URL
 * or by assembling it from individual DB_* environment variables.
 * Automatically adds pgbouncer=true when connecting to Supabase pooler to avoid 42P05 prepared statement conflicts.
 */
export function getDatabaseUrl(env: PrismaEnvironment = process.env): string {
  let resolvedUrl: string;
  const rawUrl = env.DATABASE_URL?.trim();

  if (rawUrl) {
    resolvedUrl = rawUrl;
  } else {
    const host = env.DB_HOST?.trim();
    const user = env.DB_USER?.trim();
    const password = env.DB_PASSWORD;

    if (host && user && password && password !== 'YOUR_PASSWORD') {
      const port = env.DB_PORT ? Number(env.DB_PORT) : 5432;
      const dbName = env.DB_NAME?.trim() || 'postgres';
      resolvedUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?sslmode=require`;
    } else {
      throw new Error('DATABASE_URL is required for Prisma.');
    }
  }

  // If using Supabase connection pooler, append pgbouncer=true to disable prepared statement caching
  if (resolvedUrl.includes('pooler.supabase.com') && !resolvedUrl.includes('pgbouncer=true')) {
    const separator = resolvedUrl.includes('?') ? '&' : '?';
    resolvedUrl = `${resolvedUrl}${separator}pgbouncer=true`;
  }

  return resolvedUrl;
}

let cachedPrisma: PrismaClient | undefined;

/**
 * Creates a new PrismaClient instance configured with connection options.
 */
export function createPrismaClient(env: PrismaEnvironment = process.env): PrismaClient {
  const url = getDatabaseUrl(env);
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Returns a singleton PrismaClient instance.
 */
export function getPrismaClient(env: PrismaEnvironment = process.env): PrismaClient {
  if (!cachedPrisma) {
    cachedPrisma = createPrismaClient(env);
  }
  return cachedPrisma;
}

/**
 * Resets/disconnects the cached Prisma client (useful for graceful shutdown and testing).
 */
export async function disconnectPrisma(): Promise<void> {
  if (cachedPrisma) {
    await cachedPrisma.$disconnect();
    cachedPrisma = undefined;
  }
}

/**
 * Lazy proxy allowing direct `prisma.student.findMany()` access while deferring
 * initialization until first property access.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    return Reflect.get(client, prop, receiver);
  },
});

/**
 * Verifies connectivity by executing a lightweight query.
 */
export async function verifyPrismaConnection(
  prismaClient: PrismaClient = getPrismaClient()
): Promise<{ ok: boolean; message: string }> {
  await prismaClient.$queryRaw`SELECT 1`;
  return { ok: true, message: 'Successfully connected to database via Prisma' };
}
