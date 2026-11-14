import { z } from 'zod';

export const preferencesSchema = z.object({
  minAge: z.number().int().min(18).max(100), maxAge: z.number().int().min(18).max(100),
  preferredGender: z.string(), preferredFaculty: z.string(), verifiedOnly: z.boolean(),
}).refine(value => value.minAge <= value.maxAge, { message: 'Tuổi tối thiểu không được lớn hơn tuổi tối đa.' });

export const profileSchema = z.object({
  id: z.string(), fullName: z.string().trim().min(2).max(80), email: z.string().email(),
  birthDate: z.string(), gender: z.string(), faculty: z.string().max(100), cohort: z.string().max(4),
  bio: z.string().max(500), interests: z.array(z.string()), connectionGoal: z.string(),
  avatar: z.string(), preferences: preferencesSchema,
});
export type Profile = z.infer<typeof profileSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export interface Candidate extends Profile { verified: boolean; distanceKm: number; likedMe: boolean; }

const messageSchema = z.object({ id: z.string(), senderId: z.string(), body: z.string().max(2000), sentAt: z.string() });
const conversationSchema = z.object({ id: z.string(), matchId: z.string(), participantId: z.string(), unreadCount: z.number().min(0), messages: z.array(messageSchema) });
const notificationSchema = z.object({ id: z.string(), actorId: z.string(), conversationId: z.string(), matchId: z.string(), readAt: z.string().nullable(), createdAt: z.string() });
export const stateSchema = z.object({
  version: z.literal(1), session: z.boolean(), profile: profileSchema,
  interactions: z.record(z.string(), z.enum(['THICH', 'BO_QUA', 'CHAN'])),
  conversations: z.array(conversationSchema), notifications: z.array(notificationSchema),
});
export type DemoState = z.infer<typeof stateSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type DemoNotification = z.infer<typeof notificationSchema>;

export function ageAt(birthDate: string, now = new Date()): number {
  const date = new Date(`${birthDate}T00:00:00`);
  return now.getFullYear() - date.getFullYear() - (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate()) ? 1 : 0);
}
