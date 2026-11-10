import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError.js';
import { logger, requestLogger, errorLogger } from '../shared/logger/logger.js';
import {
  getSupabaseConfig,
  verifySupabaseConnection,
} from '../supabase/supabase.js';
import {
  prisma,
  getDatabaseUrl,
  verifyPrismaConnection,
} from '../database/prisma.js';
import profileRouter from '../modules/profile/profile.router.js';
import discoveryRouter from '../modules/discovery/discovery.router.js';
import interactionRouter from '../modules/interaction/interaction.router.js';
import userRouter from '../modules/user/user.router.js';
import chatRouter from '../modules/chat/chat.router.js';
import notificationRouter from '../modules/notification/notification.router.js';


export const app = express();
export const httpServer = createServer(app);

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
console.log('Student Dating API is running. Access the API at http://localhost:3000/');
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
      redisConfigured: Boolean(process.env.REDIS_URL?.trim()),
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

// API Routes
app.use('/api/profile', profileRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/interactions', interactionRouter);
app.use('/api/chat', chatRouter);
app.use('/api/users', userRouter);
app.use('/api/notifications', notificationRouter);

// 404 Not Found Middleware
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    error: 'Not Found',
    path: req.originalUrl || req.path,
  });
});

// Zod validation error handler
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(422).json({
      status: 'fail',
      error: 'Validation Error',
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  next(err);
});

// AppError domain error handler
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? 'error' : 'fail',
      error: err.message,
      code: err.code,
    });
  }
  next(err);
});

// Error Logger Middleware
app.use(errorLogger);

// Global Error Handler Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
    message,
  });
});

