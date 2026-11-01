import { isAbsolute } from 'node:path';
import { Pool } from 'pg';

type DatabaseEnvironment = { readonly DATABASE_URL?: string };

export function getDatabaseUrl(env: DatabaseEnvironment): string {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname || url.pathname === '/') {
    throw new Error('DATABASE_URL must include a PostgreSQL host and database.');
  }
  if (!url.username || !url.password || url.password === 'YOUR_PERCENT_ENCODED_PASSWORD') {
    throw new Error('DATABASE_URL must include a username and password.');
  }
  if (url.searchParams.get('sslmode') !== 'verify-full') {
    throw new Error('DATABASE_URL must use sslmode=verify-full.');
  }
  const certificatePath = url.searchParams.get('sslrootcert');
  if (!certificatePath || !isAbsolute(certificatePath)) {
    throw new Error('DATABASE_URL must include an absolute sslrootcert path.');
  }

  return connectionString;
}

export function createDatabasePool(env: DatabaseEnvironment = process.env): Pool {
  return new Pool({
    connectionString: getDatabaseUrl(env),
    max: 5,
    connectionTimeoutMillis: 10_000,
  });
}
