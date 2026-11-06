import 'dotenv/config';
import { app, httpServer } from './app/app.js';
import { getRedisUrl } from './redis/redis.client.js';
import { getSupabaseConfig, verifySupabaseConnection } from './supabase/supabase.js';
import logger from './shared/logger/logger.js';
import { createRealtimeRuntime, RealtimeRuntime } from './shared/realtime/realtime.server.js';
import { prisma } from './database/prisma.js';
import { configureRealtimePublisher } from './shared/realtime/realtime.publisher.js';
import { initializeMatchingModule } from './modules/matching/matching.listener.js';

const isTestEnvironment =
  process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);


// Server startup
const port = Number(process.env.PORT) || 3000;

export async function startApplication(exitOnError = true): Promise<void> {
  let supabaseUrl = 'unknown';
  let realtimeRuntime: RealtimeRuntime | undefined;
  try {
    const redisUrl = getRedisUrl();
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

    logger.info('Connecting to Redis for realtime delivery...');
    realtimeRuntime = await createRealtimeRuntime(httpServer, redisUrl);
    configureRealtimePublisher(realtimeRuntime.publisher);
    logger.info('Connected to Redis for realtime delivery.');

    initializeMatchingModule();

    await new Promise<void>((resolve, reject) => {
      const onListening = () => {
        httpServer.off('error', onError);
        logger.info(`Student Dating API server is running on http://localhost:${port}`);
        resolve();
      };
      const onError = (error: Error) => {
        httpServer.off('listening', onListening);
        reject(error);
      };
      httpServer.once('listening', onListening);
      httpServer.once('error', onError);
      httpServer.listen(port);
    });
  } catch (err: unknown) {
    if (realtimeRuntime) {
      try {
        await realtimeRuntime.close();
      } catch (closeError: unknown) {
        logger.error('Realtime cleanup failed during application startup failure.', {
          error: closeError instanceof Error ? closeError.message : String(closeError),
        });
      }
    }
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

if (!isTestEnvironment) {
  startApplication(true);
}
