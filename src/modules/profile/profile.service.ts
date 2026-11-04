import { AppError } from '../../shared/errors/AppError.js';
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

    return repository.updateProfile(studentId, updateData);
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
    return getProfile(studentId);
  }

  async function upsertPreferences(studentId: string, body: UpdatePreferencesBody) {
    if (!(await repository.hasProfile(studentId))) {
      throw new AppError(404, 'Profile not found.');
    }

    return repository.upsertPreferences(studentId, body);
  }

  function listInterests() {
    return repository.listActiveInterests();
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
