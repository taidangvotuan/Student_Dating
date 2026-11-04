import { z } from 'zod';

export const InteractionTargetParamsSchema = z.object({
  targetId: z.string().uuid(),
});
