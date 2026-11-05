import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserRole, VerificationStatus } from '@prisma/client';
import { AppError } from '../src/shared/errors/AppError.js';
import {
  createUserService,
} from '../src/modules/user/user.service.js';
import {
  AssignRoleSchema,
  RejectVerificationSchema,
  UserIdParamsSchema,
} from '../src/modules/user/user.schemas.js';
import type {
  UserRepository,
} from '../src/modules/user/user.repository.js';

function createRepository(overrides: Partial<UserRepository> = {}) {
  const calls: string[] = [];
  const repository: UserRepository = {
    async studentExists(userId) {
      calls.push(`student:${userId}`);
      return true;
    },
    async getRole(userId) {
      calls.push(`role:${userId}`);
      return undefined;
    },
    async assignRole(userId, role) {
      calls.push(`assign:${userId}:${role}`);
      return { userId, role, updatedAt: new Date('2026-01-01T00:00:00.000Z') };
    },
    async getVerificationStatus(userId) {
      calls.push(`verification-status:${userId}`);
      return VerificationStatus.CHO_DUYET;
    },
    async reviewVerification(userId, reviewerId, status, rejectionReason) {
      calls.push(`review:${userId}:${reviewerId}:${status}:${rejectionReason ?? ''}`);
      return {
        studentId: userId,
        status,
        reviewerId,
        rejectionReason: rejectionReason ?? null,
        reviewedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
    },
    ...overrides,
  };
  return { repository, calls };
}

describe('User service', () => {
  it('assigns MODERATOR to an existing user', async () => {
    const { repository, calls } = createRepository();
    const service = createUserService(repository);

    const assignment = await service.assignRole(
      'admin-id',
      'target-id',
      UserRole.MODERATOR
    );

    assert.equal(assignment.role, UserRole.MODERATOR);
    assert.deepEqual(calls, ['student:target-id', 'role:target-id', 'assign:target-id:MODERATOR']);
  });

  it('returns 404 and does not assign a role to an unknown user', async () => {
    const { repository, calls } = createRepository({
      async studentExists() {
        return false;
      },
    });
    const service = createUserService(repository);

    await assert.rejects(
      service.assignRole('admin-id', 'missing-id', UserRole.ADMIN),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
    assert.deepEqual(calls, []);
  });

  it('prevents downgrading an existing ADMIN role', async () => {
    const { repository, calls } = createRepository({
      async getRole() {
        return UserRole.ADMIN;
      },
    });
    const service = createUserService(repository);

    await assert.rejects(
      service.assignRole('admin-id', 'target-id', UserRole.MODERATOR),
      (error: unknown) => error instanceof AppError && error.statusCode === 409
    );
    assert.deepEqual(calls, ['student:target-id']);
  });

  it('prevents an ADMIN from downgrading their own role', async () => {
    const { repository, calls } = createRepository();
    const service = createUserService(repository);

    await assert.rejects(
      service.assignRole('admin-id', 'admin-id', UserRole.MODERATOR),
      (error: unknown) => error instanceof AppError && error.statusCode === 409
    );
    assert.deepEqual(calls, ['student:admin-id', 'role:admin-id']);
  });

  it('rejects a pending verification and saves the moderator and reason', async () => {
    const { repository, calls } = createRepository();
    const service = createUserService(repository);

    const result = await service.rejectVerification(
      'moderator-id',
      'student-id',
      'Document is unclear'
    );

    assert.equal(result.status, VerificationStatus.TU_CHOI);
    assert.equal(result.rejectionReason, 'Document is unclear');
    assert.deepEqual(calls, [
      'verification-status:student-id',
      'review:student-id:moderator-id:TU_CHOI:Document is unclear',
    ]);
  });

  it('returns 404 when no verification exists', async () => {
    const { repository, calls } = createRepository({
      async getVerificationStatus() {
        return undefined;
      },
    });
    const service = createUserService(repository);

    await assert.rejects(
      service.approveVerification('moderator-id', 'missing-id'),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
    assert.deepEqual(calls, []);
  });

  it('does not review a verification that is not pending', async () => {
    let reviewAttempted = false;
    const { repository, calls } = createRepository({
      async getVerificationStatus() {
        return VerificationStatus.TU_CHOI;
      },
      async reviewVerification() {
        reviewAttempted = true;
        return undefined;
      },
    });
    const service = createUserService(repository);

    await assert.rejects(
      service.approveVerification('moderator-id', 'student-id'),
      (error: unknown) => error instanceof AppError && error.statusCode === 409
    );
    assert.equal(reviewAttempted, false);
    assert.deepEqual(calls, []);
  });

  it('approves a pending verification and clears any rejection reason', async () => {
    const { repository } = createRepository();
    const service = createUserService(repository);

    const result = await service.approveVerification('moderator-id', 'student-id');

    assert.equal(result.status, VerificationStatus.DA_XAC_THUC);
    assert.equal(result.rejectionReason, null);
  });
});

describe('User request validation', () => {
  it('accepts only MODERATOR or ADMIN and requires a UUID user ID', () => {
    assert.equal(AssignRoleSchema.safeParse({ role: UserRole.MODERATOR }).success, true);
    assert.equal(AssignRoleSchema.safeParse({ role: UserRole.ADMIN }).success, true);
    assert.equal(AssignRoleSchema.safeParse({ role: UserRole.USER }).success, false);
    assert.equal(UserIdParamsSchema.safeParse({ userId: 'not-a-uuid' }).success, false);
  });

  it('requires a non-blank rejection reason', () => {
    assert.equal(
      RejectVerificationSchema.safeParse({
        rejectionReason: 'Document is unclear',
      }).success,
      true
    );
    assert.equal(
      RejectVerificationSchema.safeParse({ rejectionReason: '  ' }).success,
      false
    );
  });
});
