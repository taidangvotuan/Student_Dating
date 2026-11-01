import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { getDatabaseConfig } from '../src/database.js';

const validEnv = {
  DB_HOST: 'pooler.example.com',
  DB_PORT: '5432',
  DB_NAME: 'postgres',
  DB_USER: 'postgres.project',
  DB_PASSWORD: 'p@ss:# word',
  DB_SSL_ROOT_CERT: '/tmp/ca.pem',
};

describe('database configuration', () => {
  it('requires each connection parameter', () => {
    assert.throws(() => getDatabaseConfig({}), /DB_HOST/);
    assert.throws(() => getDatabaseConfig({ ...validEnv, DB_PASSWORD: '' }), /DB_PASSWORD/);
  });

  it('rejects an invalid port and certificate path without exposing the password', () => {
    const password = 'do-not-log-this';
    assert.throws(() => getDatabaseConfig({ ...validEnv, DB_PASSWORD: password, DB_PORT: 'abc' }), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /DB_PORT/);
      assert.equal(error.message.includes(password), false);
      return true;
    });
    assert.throws(() => getDatabaseConfig({ ...validEnv, DB_SSL_ROOT_CERT: 'relative.pem' }), /DB_SSL_ROOT_CERT/);
  });

  it('uses the raw password and verifies TLS with the configured CA', () => {
    const directory = mkdtempSync(join(tmpdir(), 'student-dating-db-'));
    const certificatePath = join(directory, 'ca.pem');
    writeFileSync(certificatePath, 'test-ca');
    try {
      const config = getDatabaseConfig({ ...validEnv, DB_SSL_ROOT_CERT: certificatePath });
      assert.equal(config.host, 'pooler.example.com');
      assert.equal(config.port, 5432);
      assert.equal(config.password, 'p@ss:# word');
      assert.deepEqual(config.ssl, { ca: 'test-ca', rejectUnauthorized: true });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
