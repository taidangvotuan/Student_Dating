import { z } from 'zod';
import { NotificationStatus } from '@prisma/client';

export const NotificationParamsSchema = z.object({
  id: z.string().uuid(),
});

export const NotificationPageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  locale: z.enum(['vi', 'en']).optional(),
});

export type NotificationParams = z.infer<typeof NotificationParamsSchema>;
export type NotificationPageQuery = z.infer<typeof NotificationPageQuerySchema>;
