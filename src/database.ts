import { readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

type DatabaseEnvironment = {
  readonly DB_HOST?: string;
  readonly DB_PORT?: string;
  readonly DB_NAME?: string;
  readonly DB_USER?: string;
  readonly DB_PASSWORD?: string;
  readonly DB_SSL_ROOT_CERT?: string;
};

export function getDatabaseConfig(env: DatabaseEnvironment): PoolConfig {
  const host = env.DB_HOST?.trim();
  if (!host) {
    throw new Error('DB_HOST is required.');
  }
  const port = Number(env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('DB_PORT must be an integer from 1 to 65535.');
  }
  const database = env.DB_NAME?.trim();
  if (!database) {
    throw new Error('DB_NAME is required.');
  }
  const user = env.DB_USER?.trim();
  if (!user) {
    throw new Error('DB_USER is required.');
  }
  const password = env.DB_PASSWORD;
  if (!password || password === 'YOUR_PASSWORD') {
    throw new Error('DB_PASSWORD is required.');
  }
  const certificatePath = env.DB_SSL_ROOT_CERT;
  if (!certificatePath || !isAbsolute(certificatePath)) {
    throw new Error('DB_SSL_ROOT_CERT must be an absolute path.');
  }
  let ca: string;
  try {
    ca = readFileSync(certificatePath, 'utf8');
  } catch {
    throw new Error('DB_SSL_ROOT_CERT must point to a readable CA certificate.');
  }

  return {
    host,
    port,
    database,
    user,
    password,
    ssl: { ca, rejectUnauthorized: true },
    max: 5,
    connectionTimeoutMillis: 10_000,
  };
}

export function createDatabasePool(env: DatabaseEnvironment = process.env): Pool {
  return new Pool(getDatabaseConfig(env));
}
