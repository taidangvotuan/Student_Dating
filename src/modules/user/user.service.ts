import { UserRole, VerificationStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import {
  userRepository,
  type UserRepository,
} from './user.repository.js';

type AssignableRole = typeof UserRole.MODERATOR | typeof UserRole.ADMIN;

export function createUserService(repository: UserRepository) {
  return {
    async assignRole(actorId: string, userId: string, role: AssignableRole) {
      if (!(await repository.studentExists(userId))) {
        throw new AppError(404, 'User not found.');
      }

      const currentRole = await repository.getRole(userId);
      if (currentRole === UserRole.ADMIN && role === UserRole.MODERATOR) {
        throw new AppError(409, 'This endpoint cannot downgrade an ADMIN role.');
      }
      if (actorId === userId && role !== UserRole.ADMIN) {
        throw new AppError(409, 'You cannot downgrade your own ADMIN role.');
      }

      const assignment = await repository.assignRole(userId, role);
      logger.info('[User Service] Assign role success', {
        action: 'user.role.assigned',
        actorId,
        userId,
        role,
      });
      return assignment;
    },

    async approveVerification(reviewerId: string, userId: string) {
      const currentStatus = await repository.getVerificationStatus(userId);
      if (currentStatus === undefined) {
        throw new AppError(404, 'Verification not found.');
      }
      if (currentStatus !== VerificationStatus.CHO_DUYET) {
        throw new AppError(409, 'Only pending verifications can be reviewed.');
      }

      const result = await repository.reviewVerification(
        userId,
        reviewerId,
        VerificationStatus.DA_XAC_THUC
      );
      if (!result) {
        throw new AppError(409, 'Only pending verifications can be reviewed.');
      }

      logger.info('[User Service] Approve verification success', {
        action: 'user.verification.approved',
        actorId: reviewerId,
        userId,
        status: VerificationStatus.DA_XAC_THUC,
      });
      return result;
    },

    async rejectVerification(
      reviewerId: string,
      userId: string,
      rejectionReason: string
    ) {
      const currentStatus = await repository.getVerificationStatus(userId);
      if (currentStatus === undefined) {
        throw new AppError(404, 'Verification not found.');
      }
      if (currentStatus !== VerificationStatus.CHO_DUYET) {
        throw new AppError(409, 'Only pending verifications can be reviewed.');
      }

      const result = await repository.reviewVerification(
        userId,
        reviewerId,
        VerificationStatus.TU_CHOI,
        rejectionReason
      );
      if (!result) {
        throw new AppError(409, 'Only pending verifications can be reviewed.');
      }

      logger.info('[User Service] Reject verification success', {
        action: 'user.verification.rejected',
        actorId: reviewerId,
        userId,
        status: VerificationStatus.TU_CHOI,
      });
      return result;
    },
  };
}

const userService = createUserService(userRepository);

export const assignRole = userService.assignRole;
export const approveVerification = userService.approveVerification;
export const rejectVerification = userService.rejectVerification;
