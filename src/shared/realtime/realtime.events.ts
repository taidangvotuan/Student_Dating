export interface RealtimeMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly body: string | null;
  readonly status: 'DA_GUI' | 'DA_XOA';
  readonly sentAt: string;
  readonly deletedAt: string | null;
}

export type RealtimeEvent =
  | {
      readonly name: 'chat.message.created';
      readonly payload: RealtimeMessage;
    }
  | {
      readonly name: 'chat.message.deleted';
      readonly payload: {
        readonly messageId: string;
        readonly conversationId: string;
        readonly deletedById: string;
        readonly deletedAt: string;
      };
    }
  | {
      readonly name: 'chat.conversation.read';
      readonly payload: {
        readonly conversationId: string;
        readonly readerId: string;
        readonly lastReadAt: string;
      };
    }
  | {
      readonly name: 'matching.match.created';
      readonly payload: { readonly matchId: string };
    }
  | {
      readonly name: 'matching.match.cancelled';
      readonly payload: { readonly matchIds: readonly string[] };
    };

export interface RealtimePublisher {
  publishToUsers(userIds: readonly string[], event: RealtimeEvent): void;
}
