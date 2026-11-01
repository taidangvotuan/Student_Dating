import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDatabaseUrl } from '../src/database.js';

const validUrl =
  'postgresql://postgres.project:secret@pooler.example.com:5432/postgres?sslmode=verify-full&sslrootcert=/tmp/supabase-ca.pem';

describe('database configuration', () => {
  it('requires a connection string', () => {
    assert.throws(() => getDatabaseUrl({}), /DATABASE_URL/);
  });

  it('rejects incomplete and unverified connections without exposing the password', () => {
    const password = 'do-not-log-this';
    const insecureUrl = `postgresql://postgres.project:${password}@pooler.example.com:5432/postgres`;

    assert.throws(() => getDatabaseUrl({ DATABASE_URL: insecureUrl }), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /sslmode=verify-full/);
      assert.equal(error.message.includes(password), false);
      return true;
    });
    assert.throws(
      () => getDatabaseUrl({ DATABASE_URL: 'postgresql://pooler.example.com/postgres?sslmode=verify-full&sslrootcert=/tmp/ca.pem' }),
      /username and password/,
    );
  });

  it('accepts a connection string with certificate verification', () => {
    assert.equal(getDatabaseUrl({ DATABASE_URL: validUrl }), validUrl);
  });
});
