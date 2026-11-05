import type { NextFunction, Request, Response } from 'express';
import {
  ChatMessageSchema,
  ConversationPageQuerySchema,
  ConversationParamsSchema,
  MessagePageQuerySchema,
  MessageParamsSchema,
} from './chat.schemas.js';
import * as ChatService from './chat.service.js';

export function createChatController(
  service: Pick<
    typeof ChatService,
    | 'listConversations'
    | 'getConversation'
    | 'listMessages'
    | 'sendMessage'
    | 'deleteMessage'
    | 'markRead'
  > = ChatService
) {
  return {
    async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = ConversationPageQuerySchema.parse(req.query);
        const page = await service.listConversations(req.user!.id, query.limit, query.cursor);
        res.status(200).json({ status: 'success', data: page });
      } catch (error) {
        next(error);
      }
    },

    async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { conversationId } = ConversationParamsSchema.parse(req.params);
        const conversation = await service.getConversation(req.user!.id, conversationId);
        res.status(200).json({ status: 'success', data: conversation });
      } catch (error) {
        next(error);
      }
    },

    async listMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { conversationId } = ConversationParamsSchema.parse(req.params);
        const query = MessagePageQuerySchema.parse(req.query);
        const page = await service.listMessages(
          req.user!.id,
          conversationId,
          query.limit,
          query.cursor
        );
        res.status(200).json({ status: 'success', data: page });
      } catch (error) {
        next(error);
      }
    },

    async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { conversationId } = ConversationParamsSchema.parse(req.params);
        const { body } = ChatMessageSchema.parse(req.body);
        const message = await service.sendMessage(req.user!.id, conversationId, body);
        res.status(201).json({ status: 'success', data: message });
      } catch (error) {
        next(error);
      }
    },

    async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { conversationId, messageId } = MessageParamsSchema.parse(req.params);
        const message = await service.deleteMessage(
          req.user!.id,
          conversationId,
          messageId
        );
        res.status(200).json({ status: 'success', data: message });
      } catch (error) {
        next(error);
      }
    },

    async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { conversationId } = ConversationParamsSchema.parse(req.params);
        const marker = await service.markRead(req.user!.id, conversationId);
        res.status(200).json({ status: 'success', data: marker });
      } catch (error) {
        next(error);
      }
    },
  };
}

const chatController = createChatController();

export const {
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  deleteMessage,
  markRead,
} = chatController;
