import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import type {
  UpdateProfileBody,
  UpdateInterestsBody,
  UpdatePreferencesBody,
} from './profile.schemas.js';
import {
  profileRepository,
  type ProfileRepository,
} from './profile.repository.js';

export function createProfileService(repository: ProfileRepository) {
  async function getProfile(studentId: string) {
    const profile = await repository.findProfile(studentId);

    if (!profile) {
      throw new AppError(404, 'Profile not found.');
    }

    logger.info('[Profile Service] Get profile success', {
      action: 'profile.retrieved',
      studentId,
    });
    return profile;
  }

  async function updateProfile(studentId: string, body: UpdateProfileBody) {
    if (!(await repository.hasProfile(studentId))) {
      throw new AppError(404, 'Profile not found.');
    }

    const updateData: Parameters<ProfileRepository['updateProfile']>[1] = {
      ...(body.fullName !== undefined && { fullName: body.fullName }),
      ...(body.birthDate !== undefined && { birthDate: new Date(body.birthDate) }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.faculty !== undefined && { faculty: body.faculty }),
      ...(body.cohort !== undefined && { cohort: body.cohort }),
      ...(body.connectionGoal !== undefined && { connectionGoal: body.connectionGoal }),
      ...(body.visibility !== undefined && { visibility: body.visibility }),
    };

    const updatedProfile = await repository.updateProfile(studentId, updateData);
    logger.info('[Profile Service] Update profile success', {
      action: 'profile.updated',
      studentId,
      updatedFields: Object.keys(updateData),
    });
    return updatedProfile;
  }

  async function setInterests(
    studentId: string,
    { interestIds }: UpdateInterestsBody
  ) {
    if (!(await repository.hasProfile(studentId))) {
      throw new AppError(404, 'Profile not found.');
    }

    const uniqueIds = Array.from(new Set(interestIds));
    const validCount = await repository.countActiveInterests(uniqueIds);

    if (validCount !== uniqueIds.length) {
      throw new AppError(422, 'One or more interest IDs are invalid or inactive.');
    }

    await repository.replaceInterests(studentId, uniqueIds);
    logger.info('[Profile Service] Set interests success', {
      action: 'profile.interests.updated',
      studentId,
      interestCount: uniqueIds.length,
    });
    return getProfile(studentId);
  }

  async function upsertPreferences(studentId: string, body: UpdatePreferencesBody) {
    if (!(await repository.hasProfile(studentId))) {
      throw new AppError(404, 'Profile not found.');
    }

    const preferences = await repository.upsertPreferences(studentId, body);
    logger.info('[Profile Service] Upsert preferences success', {
      action: 'profile.preferences.updated',
      studentId,
      updatedFields: Object.keys(body),
    });
    return preferences;
  }

  async function listInterests() {
    const interests = await repository.listActiveInterests();
    logger.info('[Profile Service] List interests success', {
      action: 'profile.interests.listed',
      count: interests.length,
    });
    return interests;
  }

  return {
    getProfile,
    updateProfile,
    setInterests,
    upsertPreferences,
    listInterests,
  };
}

const profileService = createProfileService(profileRepository);

export const getProfile = profileService.getProfile;
export const updateProfile = profileService.updateProfile;
export const setInterests = profileService.setInterests;
export const upsertPreferences = profileService.upsertPreferences;
export const listInterests = profileService.listInterests;
