import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import {
  chatRepository,
  type ChatRepository,
} from './chat.repository.js';
import type { RealtimePublisher } from '../../shared/realtime/realtime.events.js';
import { publishRealtimeEvent } from '../../shared/realtime/realtime.publisher.js';

export interface ChatLifecycle {
  activateConversation(matchId: string): Promise<void>;
  deactivateConversations(matchIds: readonly string[]): Promise<void>;
}

export function createChatService(
  repository: ChatRepository,
  publisher: RealtimePublisher = { publishToUsers: publishRealtimeEvent }
) {
  return {
    async activateConversation(matchId: string) {
      await repository.activateConversation(matchId);
      logger.info('[Chat Service] Activate conversation success', {
        action: 'chat.conversation.activated',
        matchId,
      });
    },

    async deactivateConversations(matchIds: readonly string[]) {
      await repository.deactivateConversations(matchIds);
      logger.info('[Chat Service] Deactivate conversations success', {
        action: 'chat.conversation.deactivated',
        matchIds,
        count: matchIds.length,
      });
    },

    async listConversations(studentId: string, limit: number, cursor?: string) {
      const page = await repository.listConversations(studentId, limit, cursor);
      logger.info('[Chat Service] List conversations success', {
        action: 'chat.conversations.listed',
        studentId,
        count: page.conversations.length,
      });
      return page;
    },

    async getConversation(studentId: string, conversationId: string) {
      const conversation = await repository.getConversation(studentId, conversationId);
      if (!conversation) {
        throw new AppError(404, 'Conversation not found.');
      }
      logger.info('[Chat Service] Get conversation success', {
        action: 'chat.conversation.viewed',
        studentId,
        conversationId,
      });
      return conversation;
    },

    async listMessages(
      studentId: string,
      conversationId: string,
      limit: number,
      cursor?: string
    ) {
      const page = await repository.listMessages(studentId, conversationId, limit, cursor);
      if (!page) {
        throw new AppError(404, 'Conversation not found.');
      }
      logger.info('[Chat Service] List messages success', {
        action: 'chat.messages.listed',
        studentId,
        conversationId,
        count: page.messages.length,
      });
      return page;
    },

    async sendMessage(studentId: string, conversationId: string, body: string) {
      const result = await repository.sendMessage(studentId, conversationId, body);
      if (result.kind === 'not-found') {
        throw new AppError(404, 'Conversation not found.');
      }
      if (result.kind === 'inactive') {
        throw new AppError(409, 'Cannot send messages to an inactive conversation.');
      }
      logger.info('[Chat Service] Send message success', {
        action: 'chat.message.sent',
        studentId,
        conversationId,
        messageId: result.message.id,
      });
      try {
        publisher.publishToUsers([result.recipientId], {
          name: 'chat.message.created',
          payload: {
            ...result.message,
            sentAt: result.message.sentAt.toISOString(),
            deletedAt: result.message.deletedAt?.toISOString() ?? null,
          },
        });
      } catch (error) {
        logger.error('[Chat Service] Realtime message delivery failed', {
          action: 'chat.message.delivery.failed',
          studentId,
          conversationId,
          messageId: result.message.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return result.message;
    },

    async deleteMessage(studentId: string, conversationId: string, messageId: string) {
      const result = await repository.deleteMessage(studentId, conversationId, messageId);
      if (result.kind === 'not-found') {
        throw new AppError(404, 'Message or conversation not found.');
      }
      if (result.kind === 'forbidden') {
        throw new AppError(403, 'You can only delete your own messages.');
      }
      if (result.kind === 'deleted') {
        try {
          publisher.publishToUsers([result.recipientId], {
            name: 'chat.message.deleted',
            payload: {
              messageId: result.message.id,
              conversationId,
              deletedById: studentId,
              deletedAt: result.message.deletedAt.toISOString(),
            },
          });
        } catch (error) {
          logger.error('[Chat Service] Realtime message deletion delivery failed', {
            action: 'chat.message.deletion_delivery.failed',
            studentId,
            conversationId,
            messageId: result.message.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      logger.info('[Chat Service] Delete message success', {
        action: 'chat.message.deleted',
        studentId,
        conversationId,
        messageId: result.message.id,
      });
      return result.message;
    },

    async markRead(studentId: string, conversationId: string) {
      const marker = await repository.markRead(studentId, conversationId);
      if (!marker) {
        throw new AppError(404, 'Conversation not found.');
      }
      try {
        publisher.publishToUsers([marker.recipientId], {
          name: 'chat.conversation.read',
          payload: {
            conversationId: marker.conversationId,
            readerId: marker.studentId,
            lastReadAt: marker.lastReadAt.toISOString(),
          },
        });
      } catch (error) {
        logger.error('[Chat Service] Realtime read receipt delivery failed', {
          action: 'chat.conversation.read_delivery.failed',
          studentId,
          conversationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      logger.info('[Chat Service] Mark conversation read success', {
        action: 'chat.conversation.read',
        studentId,
        conversationId,
      });
      const { recipientId: _recipientId, ...readMarker } = marker;
      return readMarker;
    },
  };
}

const chatService = createChatService(chatRepository);

export const listConversations = chatService.listConversations;
export const activateConversation = chatService.activateConversation;
export const deactivateConversations = chatService.deactivateConversations;
export const getConversation = chatService.getConversation;
export const listMessages = chatService.listMessages;
export const sendMessage = chatService.sendMessage;
export const deleteMessage = chatService.deleteMessage;
export const markRead = chatService.markRead;
