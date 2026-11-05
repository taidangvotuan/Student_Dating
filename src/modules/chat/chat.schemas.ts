import { z } from 'zod';

export const ConversationParamsSchema = z.object({
  conversationId: z.string().uuid(),
});

export const MessageParamsSchema = ConversationParamsSchema.extend({
  messageId: z.string().uuid(),
});

export const ConversationPageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(256).optional(),
});

export const MessagePageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().uuid().optional(),
});

export const ChatMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export type ConversationPageQuery = z.infer<typeof ConversationPageQuerySchema>;
export type MessagePageQuery = z.infer<typeof MessagePageQuerySchema>;
export type ChatMessageBody = z.infer<typeof ChatMessageSchema>;
