import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

export interface SupabaseEnvironment {
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey?: string;
  serviceRoleKey?: string;
  /** Active key used for client operations (defaults to serviceRoleKey if available, else anonKey) */
  key: string;
  isServiceRole: boolean;
}

export interface SupabaseVerificationResult {
  ok: boolean;
  message: string;
  url: string;
  isServiceRole: boolean;
}

export interface VerifySupabaseOptions {
  timeoutMs?: number;
  useServiceRole?: boolean;
}

export interface CreateClientOptions {
  useServiceRole?: boolean;
}

/**
 * Recommended default options for server-side / service-role Supabase clients.
 * Disables session persistence and auto-refresh to prevent token bleed across server requests.
 */
export const DEFAULT_SERVICE_ROLE_OPTIONS: SupabaseClientOptions<'public'> = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

/**
 * Validates and extracts Supabase configuration from environment variables.
 * Prefers SUPABASE_SERVICE_ROLE_KEY for server operations, but accepts SUPABASE_ANON_KEY.
 */
export function getSupabaseConfig(env: SupabaseEnvironment = process.env): SupabaseConfig {
  const rawUrl = env.SUPABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error('SUPABASE_URL is required.');
  }

  // Strip trailing slashes and common subpath suffixes like /rest/v1
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error('SUPABASE_URL must be a valid HTTP or HTTPS URL.');
  }

  const rawServiceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const serviceRoleKey =
    rawServiceKey && rawServiceKey !== 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
      ? rawServiceKey
      : undefined;

  const rawAnonKey = env.SUPABASE_ANON_KEY?.trim();
  const anonKey =
    rawAnonKey && rawAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
      ? rawAnonKey
      : undefined;

  if (!serviceRoleKey && !anonKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required.');
  }

  const key = serviceRoleKey ?? anonKey!;
  const isServiceRole = Boolean(serviceRoleKey);

  return {
    url,
    serviceRoleKey,
    anonKey,
    key,
    isServiceRole,
  };
}

/**
 * Validates and strictly returns the service role key configuration.
 * Throws an error if SUPABASE_SERVICE_ROLE_KEY is missing or invalid.
 */
export function getSupabaseServiceRoleConfig(env: SupabaseEnvironment = process.env): {
  url: string;
  serviceRoleKey: string;
} {
  const config = getSupabaseConfig(env);
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service-role/admin operations.');
  }
  return {
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
  };
}

let cachedClient: SupabaseClient | undefined;
let cachedAdminClient: SupabaseClient | undefined;

/**
 * Creates a fresh Supabase client instance configured with the service role key.
 * Disables autoRefreshToken and persistSession for safe server-side execution.
 */
export function createSupabaseAdminClient(
  env: SupabaseEnvironment = process.env,
  options?: SupabaseClientOptions<'public'>
): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseServiceRoleConfig(env);
  const mergedOptions: SupabaseClientOptions<'public'> = {
    ...DEFAULT_SERVICE_ROLE_OPTIONS,
    ...options,
    auth: {
      ...DEFAULT_SERVICE_ROLE_OPTIONS.auth,
      ...options?.auth,
    },
  };
  return createClient(url, serviceRoleKey, mergedOptions);
}

/**
 * Alias for `createSupabaseAdminClient`.
 */
export const createSupabaseServiceClient = createSupabaseAdminClient;

/**
 * Returns a cached singleton Supabase admin client (service-role authenticated).
 */
export function getSupabaseAdminClient(env: SupabaseEnvironment = process.env): SupabaseClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseAdminClient(env);
  }
  return cachedAdminClient;
}

/**
 * Alias for `getSupabaseAdminClient`.
 */
export const getSupabaseServiceClient = getSupabaseAdminClient;

/**
 * Creates a fresh Supabase client instance using the provided configuration.
 * In server environments, defaults to using SUPABASE_SERVICE_ROLE_KEY if available.
 */
export function createSupabaseClient(
  env: SupabaseEnvironment = process.env,
  options?: SupabaseClientOptions<'public'>,
  clientConfig?: CreateClientOptions
): SupabaseClient {
  const config = getSupabaseConfig(env);
  const preferServiceRole = clientConfig?.useServiceRole ?? true;

  if (preferServiceRole && config.serviceRoleKey) {
    const mergedOptions: SupabaseClientOptions<'public'> = {
      ...DEFAULT_SERVICE_ROLE_OPTIONS,
      ...options,
      auth: {
        ...DEFAULT_SERVICE_ROLE_OPTIONS.auth,
        ...options?.auth,
      },
    };
    return createClient(config.url, config.serviceRoleKey, mergedOptions);
  }

  if (!config.anonKey) {
    if (config.serviceRoleKey) {
      return createClient(config.url, config.serviceRoleKey, {
        ...DEFAULT_SERVICE_ROLE_OPTIONS,
        ...options,
        auth: {
          ...DEFAULT_SERVICE_ROLE_OPTIONS.auth,
          ...options?.auth,
        },
      });
    }
    throw new Error('SUPABASE_ANON_KEY is required when service role key is disabled.');
  }

  return createClient(config.url, config.anonKey, options);
}

/**
 * Returns a cached singleton Supabase client or initializes one using environment variables.
 */
export function getSupabaseClient(env: SupabaseEnvironment = process.env): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createSupabaseClient(env);
  }
  return cachedClient;
}

/**
 * Resets cached singleton clients (useful for testing).
 */
export function resetSupabaseClient(): void {
  cachedClient = undefined;
  cachedAdminClient = undefined;
}

/**
 * Lazy proxy allowing direct `supabase.from(...)` access while deferring initialization
 * until first property access.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Lazy proxy allowing direct `supabaseAdmin.auth.admin(...)` access with service-role privileges.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdminClient();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Actively checks network connectivity and authentication credentials with Supabase.
 * Supports verifying with service role key or anon key.
 * Throws an error if the URL is unreachable or credentials are rejected.
 */
export async function verifySupabaseConnection(
  env: SupabaseEnvironment = process.env,
  optionsOrTimeout: number | VerifySupabaseOptions = 8000
): Promise<SupabaseVerificationResult> {
  const options: VerifySupabaseOptions =
    typeof optionsOrTimeout === 'number'
      ? { timeoutMs: optionsOrTimeout }
      : optionsOrTimeout;

  const timeoutMs = options.timeoutMs ?? 8000;
  const config = getSupabaseConfig(env);

  let keyToVerify: string;
  let isServiceRoleKey: boolean;

  if (options.useServiceRole === true) {
    if (!config.serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required when verifying service-role connection.');
    }
    keyToVerify = config.serviceRoleKey;
    isServiceRoleKey = true;
  } else if (options.useServiceRole === false) {
    if (!config.anonKey) {
      throw new Error('SUPABASE_ANON_KEY is required when verifying anonymous connection.');
    }
    keyToVerify = config.anonKey;
    isServiceRoleKey = false;
  } else {
    keyToVerify = config.key;
    isServiceRoleKey = config.isServiceRole;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: keyToVerify,
        Authorization: `Bearer ${keyToVerify}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok || response.status === 200) {
      return {
        ok: true,
        message: `Successfully connected and authenticated with Supabase (${isServiceRoleKey ? 'service_role' : 'anon'})`,
        url: config.url,
        isServiceRole: isServiceRoleKey,
      };
    }

    if (response.status === 401 || response.status === 403) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Supabase authentication rejected: Invalid API key. Details: ${errorText}`);
    }

    const errorText = await response.text().catch(() => '');
    throw new Error(`Supabase connection check returned HTTP ${response.status}: ${errorText}`);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(`Supabase connection timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
    throw new Error(String(err));
  }
}
