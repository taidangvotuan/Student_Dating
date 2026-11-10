import winston from 'winston';
import type { Request, Response, NextFunction } from 'express';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'anonkey',
  'apikey',
  'access_token',
  'refresh_token',
]);

/**
 * Custom winston format to redact sensitive keys from log metadata.
 * Preserves Winston internal Symbol properties (like Symbol.for('level')).
 */
export const redactSensitiveData = winston.format((info) => {
  const redact = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(redact);
    }

    const cleaned: Record<string | symbol, unknown> = {};

    // Copy symbol properties first (critical for Winston's internal level/message symbols)
    for (const sym of Object.getOwnPropertySymbols(obj)) {
      cleaned[sym] = (obj as Record<symbol, unknown>)[sym];
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = redact(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  return redact(info) as winston.Logform.TransformableInfo;
});

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);

const devFormat = printf(({ level, message, timestamp: time, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const stackString = stack ? `\n${stack}` : '';
  return `[${time}] ${level}: ${message}${metaString}${stackString}`;
});

const defaultLogLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Winston application logger instance.
 */
export const logger = winston.createLogger({
  level: defaultLogLevel,
  silent: isTest && !process.env.LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    redactSensitiveData()
  ),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? json()
        : combine(colorize(), devFormat),
    }),
  ],
});

/**
 * Express middleware for logging incoming requests and response metrics.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const statusCode = res.statusCode;
    const logData = { method, url: originalUrl, statusCode, durationMs: duration, ip };

    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(message, logData);
    } else if (statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
}

/**
 * Express middleware for logging unhandled route errors.
 */
export function errorLogger(err: unknown, req: Request, _res: Response, next: NextFunction): void {
  const errorMetadata =
    err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name }
      : { message: String(err) };

  logger.error(`Error processing ${req.method} ${req.originalUrl}: ${errorMetadata.message}`, {
    ...errorMetadata,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  next(err);
}

export default logger;
