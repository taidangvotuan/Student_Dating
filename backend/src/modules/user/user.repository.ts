import {
  UserRole,
  VerificationStatus,
  type PrismaClient,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export interface UserRepository {
  studentExists(userId: string): Promise<boolean>;
  getRole(userId: string): Promise<UserRole | undefined>;
  assignRole(
    userId: string,
    role: typeof UserRole.MODERATOR | typeof UserRole.ADMIN
  ): Promise<{
    userId: string;
    role: UserRole;
    updatedAt: Date;
  }>;
  getVerificationStatus(userId: string): Promise<VerificationStatus | undefined>;
  reviewVerification(
    userId: string,
    reviewerId: string,
    status: typeof VerificationStatus.DA_XAC_THUC | typeof VerificationStatus.TU_CHOI,
    rejectionReason?: string
  ): Promise<{
    studentId: string;
    status: VerificationStatus;
    reviewerId: string | null;
    rejectionReason: string | null;
    reviewedAt: Date | null;
  } | undefined>;
}

export function createUserRepository(
  client: PrismaClient = prisma
): UserRepository {
  return {
    async studentExists(userId) {
      
      const student = await client.student.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      return student !== null;
    },

    async getRole(userId) {
      const assignment = await client.userRoleAssignment.findUnique({
        where: { userId },
        select: { role: true },
      });
      return assignment?.role;
    },

    async assignRole(userId, role) {
      return client.userRoleAssignment.upsert({
        where: { userId },
        create: { userId, role },
        update: { role },
        select: { userId: true, role: true, updatedAt: true },
      });
    },

    async getVerificationStatus(userId) {
      const verification = await client.verification.findUnique({
        where: { studentId: userId },
        select: { status: true },
      });
      return verification?.status;
    },

    async reviewVerification(userId, reviewerId, status, rejectionReason) {
      const result = await client.verification.updateMany({
        where: { studentId: userId, status: VerificationStatus.CHO_DUYET },
        data: {
          status,
          reviewerId,
          rejectionReason: status === VerificationStatus.TU_CHOI ? rejectionReason : null,
          reviewedAt: new Date(),
        },
      });

      if (result.count === 0) return undefined;

      return (await client.verification.findUnique({
        where: { studentId: userId },
        select: {
          studentId: true,
          status: true,
          reviewerId: true,
          rejectionReason: true,
          reviewedAt: true,
        },
      })) ?? undefined;
    },
  };
}

export const userRepository = createUserRepository();
