import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import * as ProfileController from './profile.controller.js';
import { requireRole } from '../../shared/middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All profile operations require authentication
router.use(authenticate);

router.get('/interests', ProfileController.listInterests);
router.get('/',requireRole(UserRole.USER), ProfileController.getProfile);
router.patch('/', ProfileController.updateProfile);
router.put('/interests', ProfileController.setInterests);
router.put('/preferences', ProfileController.upsertPreferences);

export default router;
