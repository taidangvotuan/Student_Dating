import { Prisma, type Interest, type ProfileVisibility } from '@prisma/client';
import type { PrismaClient, SearchPreference } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import type { UpdatePreferencesBody } from './profile.schemas.js';

const profileDetailsInclude = {
  profileInterests: {
    where: { isVisible: true },
    include: {
      interest: {
        select: { id: true, name: true },
      },
    },
  },
  searchPreference: true,
  student: {
    select: {
      accountStatus: true,
      verification: {
        select: {
          status: true,
          universityName: true,
        },
      },
    },
  },
} satisfies Prisma.ProfileInclude;

const updatedProfileInclude = {
  profileInterests: {
    where: { isVisible: true },
    include: {
      interest: { select: { id: true, name: true } },
    },
  },
  searchPreference: true,
} satisfies Prisma.ProfileInclude;

export type ProfileDetails = Prisma.ProfileGetPayload<{
  include: typeof profileDetailsInclude;
}>;

export type UpdatedProfile = Prisma.ProfileGetPayload<{
  include: typeof updatedProfileInclude;
}>;

export interface ProfileUpdate {
  readonly fullName?: string;
  readonly birthDate?: Date;
  readonly gender?: string;
  readonly bio?: string;
  readonly faculty?: string;
  readonly cohort?: string;
  readonly connectionGoal?: string;
  readonly visibility?: ProfileVisibility;
}

export interface ProfileRepository {
  findProfile(studentId: string): Promise<ProfileDetails | null>;
  hasProfile(studentId: string): Promise<boolean>;
  updateProfile(studentId: string, data: ProfileUpdate): Promise<UpdatedProfile>;
  countActiveInterests(interestIds: readonly string[]): Promise<number>;
  replaceInterests(studentId: string, interestIds: readonly string[]): Promise<void>;
  upsertPreferences(
    studentId: string,
    preferences: UpdatePreferencesBody
  ): Promise<SearchPreference>;
  listActiveInterests(): Promise<Array<Pick<Interest, 'id' | 'name'>>>;
}

export function createProfileRepository(
  client: PrismaClient = prisma
): ProfileRepository {
  return {
    findProfile(studentId) {
      return client.profile.findUnique({
        where: { studentId },
        include: profileDetailsInclude,
      });
    },

    async hasProfile(studentId) {
      const profile = await client.profile.findUnique({
        where: { studentId },
        select: { studentId: true },
      });
      return profile !== null;
    },

    updateProfile(studentId, data) {
      return client.profile.update({
        where: { studentId },
        data,
        include: updatedProfileInclude,
      });
    },

    countActiveInterests(interestIds) {
      if (interestIds.length === 0) return Promise.resolve(0);

      return client.interest.count({
        where: {
          id: { in: [...interestIds] },
          isActive: true,
        },
      });
    },

    async replaceInterests(studentId, interestIds) {
      await client.$transaction(async (transaction) => {
        await transaction.profileInterest.deleteMany({
          where: { studentId },
        });

        if (interestIds.length > 0) {
          await transaction.profileInterest.createMany({
            data: interestIds.map((interestId) => ({
              studentId,
              interestId,
              isVisible: true,
            })),
          });
        }
      });
    },

    upsertPreferences(studentId, preferences) {
      return client.searchPreference.upsert({
        where: { studentId },
        create: {
          studentId,
          ...preferences,
        },
        update: {
          ...preferences,
        },
      });
    },

    listActiveInterests() {
      return client.interest.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    },
  };
}

export const profileRepository = createProfileRepository();
