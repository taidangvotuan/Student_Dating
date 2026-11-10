import type { Request, Response, NextFunction } from 'express';
import { InteractionTargetParamsSchema } from './interaction.schemas.js';
import * as InteractionService from './interaction.service.js';

export function createInteractionController(
  service: Pick<
    typeof InteractionService,
    'likeInteraction' | 'skipInteraction' | 'blockInteraction'
  > = InteractionService
) {
  async function handleInteraction(
    req: Request,
    res: Response,
    next: NextFunction,
    perform: (actorId: string, targetId: string) => Promise<unknown>
  ): Promise<void> {
    try {
      const { targetId } = InteractionTargetParamsSchema.parse(req.params);
      const result = await perform(req.user!.id, targetId);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  return {
    like: (req: Request, res: Response, next: NextFunction) =>
      handleInteraction(req, res, next, service.likeInteraction),
    skip: (req: Request, res: Response, next: NextFunction) =>
      handleInteraction(req, res, next, service.skipInteraction),
    block: (req: Request, res: Response, next: NextFunction) =>
      handleInteraction(req, res, next, service.blockInteraction),
  };
}

const interactionController = createInteractionController();
export const { like, skip, block } = interactionController;
