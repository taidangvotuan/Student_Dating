import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import * as DiscoveryController from './discovery.controller.js';

const router = Router();

router.use(authenticate);
router.get('/criteria', DiscoveryController.getSearchCriteria);
router.put('/criteria', DiscoveryController.updateSearchCriteria);

router.get('/', DiscoveryController.getDiscoveryFeed);

export default router;
