import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSupabaseConfig,
  getSupabaseServiceRoleConfig,
  createSupabaseClient,
  createSupabaseAdminClient,
  getSupabaseClient,
  getSupabaseAdminClient,
  resetSupabaseClient,
  supabase,
  supabaseAdmin,
  DEFAULT_SERVICE_ROLE_OPTIONS,
} from '../src/supabase/supabase.js';

describe('Supabase Client Configuration and Service Role Key', () => {
  beforeEach(() => {
    resetSupabaseClient();
  });

  describe('getSupabaseConfig', () => {
    it('should throw an error if SUPABASE_URL is missing', () => {
      assert.throws(
        () => getSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' }),
        { message: 'SUPABASE_URL is required.' }
      );
    });

    it('should throw an error if SUPABASE_URL is not http/https', () => {
      assert.throws(
        () =>
          getSupabaseConfig({
            SUPABASE_URL: 'ftp://not-valid.com',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
          }),
        { message: 'SUPABASE_URL must be a valid HTTP or HTTPS URL.' }
      );
    });

    it('should strip trailing slashes and /rest/v1 from URL', () => {
      const config = getSupabaseConfig({
        SUPABASE_URL: 'https://test-project.supabase.co/rest/v1/',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      });
      assert.equal(config.url, 'https://test-project.supabase.co');
    });

    it('should throw an error if neither service role key nor anon key is provided', () => {
      assert.throws(
        () =>
          getSupabaseConfig({
            SUPABASE_URL: 'https://test-project.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SUPABASE_SERVICE_ROLE_KEY',
            SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
          }),
        { message: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required.' }
      );
    });

    it('should prefer service role key when both are provided', () => {
      const config = getSupabaseConfig({
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'valid-service-role-key',
        SUPABASE_ANON_KEY: 'valid-anon-key',
      });

      assert.equal(config.serviceRoleKey, 'valid-service-role-key');
      assert.equal(config.anonKey, 'valid-anon-key');
      assert.equal(config.key, 'valid-service-role-key');
      assert.equal(config.isServiceRole, true);
    });

    it('should fall back to anon key when service role key is absent', () => {
      const config = getSupabaseConfig({
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_ANON_KEY: 'valid-anon-key',
      });

      assert.equal(config.serviceRoleKey, undefined);
      assert.equal(config.anonKey, 'valid-anon-key');
      assert.equal(config.key, 'valid-anon-key');
      assert.equal(config.isServiceRole, false);
    });
  });

  describe('getSupabaseServiceRoleConfig', () => {
    it('should throw if service role key is absent', () => {
      assert.throws(
        () =>
          getSupabaseServiceRoleConfig({
            SUPABASE_URL: 'https://test-project.supabase.co',
            SUPABASE_ANON_KEY: 'valid-anon-key',
          }),
        { message: 'SUPABASE_SERVICE_ROLE_KEY is required for service-role/admin operations.' }
      );
    });

    it('should return url and serviceRoleKey when present', () => {
      const config = getSupabaseServiceRoleConfig({
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'valid-service-key',
      });
      assert.equal(config.url, 'https://test-project.supabase.co');
      assert.equal(config.serviceRoleKey, 'valid-service-key');
    });
  });

  describe('Client creation and singletons', () => {
    const mockEnv = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'valid-service-key',
      SUPABASE_ANON_KEY: 'valid-anon-key',
    };

    it('should create an admin client with service-role defaults (no session persistence)', () => {
      const adminClient = createSupabaseAdminClient(mockEnv);
      assert.ok(adminClient);
      assert.equal(typeof adminClient.from, 'function');
      assert.equal(typeof adminClient.auth.admin, 'object');
    });

    it('should return singleton instance from getSupabaseAdminClient', () => {
      const client1 = getSupabaseAdminClient(mockEnv);
      const client2 = getSupabaseAdminClient(mockEnv);
      assert.strictEqual(client1, client2);
    });

    it('should create default client preferring service role key', () => {
      const client = createSupabaseClient(mockEnv);
      assert.ok(client);
    });

    it('should allow forcing anon key via clientConfig', () => {
      const client = createSupabaseClient(mockEnv, undefined, { useServiceRole: false });
      assert.ok(client);
    });

    it('should clear singletons on resetSupabaseClient', () => {
      const admin1 = getSupabaseAdminClient(mockEnv);
      const client1 = getSupabaseClient(mockEnv);

      resetSupabaseClient();

      const admin2 = getSupabaseAdminClient(mockEnv);
      const client2 = getSupabaseClient(mockEnv);

      assert.notStrictEqual(admin1, admin2);
      assert.notStrictEqual(client1, client2);
    });

    it('should expose default options with autoRefreshToken and persistSession false', () => {
      assert.equal(DEFAULT_SERVICE_ROLE_OPTIONS.auth?.autoRefreshToken, false);
      assert.equal(DEFAULT_SERVICE_ROLE_OPTIONS.auth?.persistSession, false);
    });

    it('should access methods via supabase and supabaseAdmin proxies', () => {
      // Set process.env temporarily for proxy access
      const originalUrl = process.env.SUPABASE_URL;
      const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.SUPABASE_URL = mockEnv.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = mockEnv.SUPABASE_SERVICE_ROLE_KEY;

      try {
        assert.equal(typeof supabase.from, 'function');
        assert.equal(typeof supabaseAdmin.from, 'function');
        assert.equal(typeof supabaseAdmin.auth.admin, 'object');
      } finally {
        process.env.SUPABASE_URL = originalUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
      }
    });
  });
});
