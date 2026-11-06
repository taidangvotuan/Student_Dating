import { logger } from '../../src/shared/logger/logger.js';

export interface CapturedLog {
  readonly message: string;
  readonly metadata: Record<string, unknown>;
}

export async function captureInfoLogs(
  operation: () => Promise<void>
): Promise<readonly CapturedLog[]> {
  const entries: CapturedLog[] = [];
  const originalInfo = Object.getOwnPropertyDescriptor(logger, 'info');

  Object.defineProperty(logger, 'info', {
    configurable: true,
    value: (message: string, metadata: Record<string, unknown>) => {
      entries.push({ message, metadata });
      return logger;
    },
  });

  try {
    await operation();
  } finally {
    if (originalInfo) Object.defineProperty(logger, 'info', originalInfo);
    else Reflect.deleteProperty(logger, 'info');
  }

  return entries;
}
