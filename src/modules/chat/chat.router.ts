import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import * as ChatController from './chat.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', ChatController.listConversations);
router.get('/:conversationId', ChatController.getConversation);
router.get('/:conversationId/messages', ChatController.listMessages);
router.post('/:conversationId/messages', ChatController.sendMessage);
router.delete(
  '/:conversationId/messages/:messageId',
  ChatController.deleteMessage
);
router.put('/:conversationId/read', ChatController.markRead);

export default router;