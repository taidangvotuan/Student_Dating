import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import * as NotificationController from './notification.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.listNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);

router.put('/:id/read', NotificationController.markAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

router.put('/read-all', NotificationController.markAllAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

router.delete('/:id', NotificationController.deleteNotification);

export default router;
