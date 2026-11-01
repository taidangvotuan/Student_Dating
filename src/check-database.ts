import { createDatabasePool } from './database.js';

async function main(): Promise<void> {
  let pool: ReturnType<typeof createDatabasePool> | undefined;
  try {
    pool = createDatabasePool();
    await pool.query('SELECT 1');
    console.log('Database connection OK.');
  } catch {
    console.error('Database connection failed. Check DB_* values, the CA certificate, and network access.');
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
