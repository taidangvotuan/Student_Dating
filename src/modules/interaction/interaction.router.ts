import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import * as InteractionController from './interaction.controller.js';

const router = Router();

router.use(authenticate);
router.post('/:targetId/like', InteractionController.like);
router.post('/:targetId/skip', InteractionController.skip);
router.post('/:targetId/block', InteractionController.block);

export default router;
