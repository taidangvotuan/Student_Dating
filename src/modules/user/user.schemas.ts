import { UserRole, VerificationStatus } from '@prisma/client';
import { z } from 'zod';

export const UserIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const AssignRoleSchema = z.object({
  role: z.enum([UserRole.MODERATOR, UserRole.ADMIN]),
});

export const RejectVerificationSchema = z.object({
  rejectionReason: z.string().trim().min(1),
});

export type AssignRoleBody = z.infer<typeof AssignRoleSchema>;
export type RejectVerificationBody = z.infer<typeof RejectVerificationSchema>;
