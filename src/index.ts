import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { logger, requestLogger, errorLogger } from './utils/logger.js';
import {
  supabase,
  getSupabaseClient,
  createSupabaseClient,
  getSupabaseConfig,
  verifySupabaseConnection,
} from './supabase/supabase.js';
import {
  prisma,
  getDatabaseUrl,
  verifyPrismaConnection,
  disconnectPrisma,
} from './database/prisma.js';

export const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Student Dating API',
    version: '1.0.0',
    status: 'online',
    message: 'Welcome to the Student Dating platform API',
  });
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  let isSupabaseConfigured = false;
  try {
    getSupabaseConfig();
    isSupabaseConfigured = true;
  } catch {
    isSupabaseConfigured = false;
  }

  let isPrismaConfigured = false;
  try {
    getDatabaseUrl();
    isPrismaConfigured = true;
  } catch {
    isPrismaConfigured = false;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      supabaseConfigured: isSupabaseConfigured,
      prismaConfigured: isPrismaConfigured,
    },
  });
});

// Supabase status route
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  try {
    const result = await verifySupabaseConnection();
    res.json({
      status: 'connected',
      url: result.url,
      message: result.message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Supabase error';
    res.status(503).json({
      status: 'failed',
      error: message,
    });
  }
});

// Prisma status route
app.get('/api/prisma/status', async (_req: Request, res: Response) => {
  try {
    const result = await verifyPrismaConnection(prisma);
    res.json({
      status: 'connected',
      message: result.message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Prisma error';
    res.status(503).json({
      status: 'failed',
      error: message,
    });
  }
});

// 404 Not Found Middleware
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl || req.path,
  });
});

// Error Logger Middleware
app.use(errorLogger);

// Global Error Handler Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({
    error: 'Internal Server Error',
    message,
  });
});

// Server startup
const PORT = Number(process.env.PORT) || 3000;
let server: import('node:http').Server | undefined;

/**
 * Initializes and starts the application:
 * 1. Verifies connectivity to Supabase.
 * 2. Connects to PostgreSQL via Prisma Client.
 * 3. Starts the HTTP server if all checks pass.
 */
export async function startApplication(exitOnError = true): Promise<void> {
  let supabaseUrl = 'unknown';
  try {
    const { url } = getSupabaseConfig();
    supabaseUrl = url;
    logger.info('Connecting to Supabase...', { url });

    const result = await verifySupabaseConnection();
    logger.info('Connected to Supabase successfully.', {
      url: result.url,
      message: result.message,
    });

    logger.info('Connecting to PostgreSQL database via Prisma...');
    await prisma.$connect();
    logger.info('Connected to database via Prisma successfully.');

    app.listen(PORT, () => {
      logger.info(`🚀 Student Dating API server is running on http://localhost:${PORT}`);
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Application startup failure: ${message}`, {
      url: supabaseUrl,
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    });

    if (exitOnError) {
      logger.error('Application terminating due to startup failure.');
      process.exit(1);
    }
    throw err;
  }
}

const isTestEnvironment = process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);

if (!isTestEnvironment) {
  startApplication(true);
}
