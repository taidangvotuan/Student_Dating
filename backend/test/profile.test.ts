import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UpdateProfileSchema,
  UpdatePreferencesSchema,
  UpdateInterestsSchema,
} from '../src/modules/profile/profile.schemas.js';
import {
  createProfileService,
} from '../src/modules/profile/profile.service.js';
import type { ProfileRepository } from '../src/modules/profile/profile.repository.js';
import { AppError } from '../src/shared/errors/AppError.js';
import { captureInfoLogs } from './helpers/capture-logger.js';

function createProfileRepository(
  overrides: Partial<ProfileRepository> = {}
): ProfileRepository {
  return {
    findProfile: async () => null,
    hasProfile: async () => false,
    updateProfile: async () => {
      throw new Error('Unexpected profile update.');
    },
    countActiveInterests: async () => 0,
    replaceInterests: async () => {},
    upsertPreferences: async () => {
      throw new Error('Unexpected preference upsert.');
    },
    listActiveInterests: async () => [],
    ...overrides,
  };
}

describe('Profile Module', () => {
  describe('UpdateProfileSchema Validation', () => {
    it('should reject an empty update object', () => {
      const result = UpdateProfileSchema.safeParse({});
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((issue) =>
            issue.message.includes('At least one profile field must be provided')
          )
        );
      }
    });

    it('should accept valid partial update fields', () => {
      const result = UpdateProfileSchema.safeParse({
        fullName: 'Nguyen Van A',
        visibility: 'CON_HOAT_DONG',
        birthDate: '2001-08-20',
      });
      assert.equal(result.success, true);
    });

    it('should reject invalid visibility values', () => {
      const result = UpdateProfileSchema.safeParse({
        visibility: 'UNAUTHORIZED_STATUS',
      });
      assert.equal(result.success, false);
    });

    it('should reject invalid birthDate format', () => {
      const result = UpdateProfileSchema.safeParse({
        birthDate: '20-08-2001',
      });
      assert.equal(result.success, false);
    });
  });

  describe('UpdatePreferencesSchema Validation', () => {
    it('should accept valid age range and filters', () => {
      const result = UpdatePreferencesSchema.safeParse({
        minAge: 18,
        maxAge: 25,
        preferredGender: 'Nu',
        maxDistanceKm: 20,
        verifiedOnly: true,
      });
      assert.equal(result.success, true);
    });

    it('should reject when minAge is greater than maxAge', () => {
      const result = UpdatePreferencesSchema.safeParse({
        minAge: 30,
        maxAge: 20,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((issue) =>
            issue.message.includes('minAge cannot be greater than maxAge')
          )
        );
      }
    });

    it('should reject minAge below 18', () => {
      const result = UpdatePreferencesSchema.safeParse({
        minAge: 16,
      });
      assert.equal(result.success, false);
    });
  });

  describe('UpdateInterestsSchema Validation', () => {
    it('should accept valid array of UUIDs', () => {
      const result = UpdateInterestsSchema.safeParse({
        interestIds: [
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        ],
      });
      assert.equal(result.success, true);
    });

    it('should reject non-UUID strings', () => {
      const result = UpdateInterestsSchema.safeParse({
        interestIds: ['invalid-uuid-string'],
      });
      assert.equal(result.success, false);
    });
  });

  describe('ProfileService', () => {
    it('logs profile updates with changed field names, not profile contents', async () => {
      const service = createProfileService(
        createProfileRepository({
          hasProfile: async () => true,
          updateProfile: async () => ({ studentId: 'student-id' } as never),
        })
      );

      const logs = await captureInfoLogs(async () => {
        await service.updateProfile('student-id', { fullName: 'Private name' });
      });

      assert.deepEqual(logs, [{
        message: '[Profile Service] Update profile success',
        metadata: {
          action: 'profile.updated',
          studentId: 'student-id',
          updatedFields: ['fullName'],
        },
      }]);
      assert.equal(JSON.stringify(logs).includes('Private name'), false);
    });

    it('should throw 404 AppError when getProfile is called for non-existent student', async () => {
      const service = createProfileService(createProfileRepository());

      await assert.rejects(
        () => service.getProfile('00000000-0000-0000-0000-000000000000'),
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.message, 'Profile not found.');
          return true;
        }
      );
    });

    it('should throw 404 AppError when updateProfile is called for non-existent student', async () => {
      const service = createProfileService(createProfileRepository());

      await assert.rejects(
        () =>
          service.updateProfile('00000000-0000-0000-0000-000000000000', {
            fullName: 'Test User',
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.message, 'Profile not found.');
          return true;
        }
      );
    });

    it('should reject inactive interest IDs before replacing selected interests', async () => {
      let replaced = false;
      const service = createProfileService(
        createProfileRepository({
          hasProfile: async () => true,
          countActiveInterests: async () => 0,
          replaceInterests: async () => {
            replaced = true;
          },
        })
      );

      await assert.rejects(
        () =>
          service.setInterests('00000000-0000-0000-0000-000000000000', {
            interestIds: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
          }),
        (err: unknown) => err instanceof AppError && err.statusCode === 422
      );
      assert.equal(replaced, false);
    });
  });
});
