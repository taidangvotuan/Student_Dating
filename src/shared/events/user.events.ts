import { EventBus } from './event-bus.js';

export interface VerificationReviewedEvent {
  userId: string;
  reviewerId: string;
  status: 'DA_XAC_THUC' | 'TU_CHOI';
  rejectionReason?: string;
}

export interface UserEvents {
  'user.verification-reviewed': VerificationReviewedEvent;
}

export const userEventBus = new EventBus<UserEvents>();
