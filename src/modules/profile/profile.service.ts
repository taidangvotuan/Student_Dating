import { prisma } from '../../database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import type {
  UpdateProfileBody,
  UpdateInterestsBody,
  UpdatePreferencesBody,
} from './profile.schemas.js';

export async function getProfile(studentId: string) {
  const profile = await prisma.profile.findUnique({
    where: { studentId },
    include: {
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
    },
  });

  if (!profile) {
    throw new AppError(404, 'Profile not found.');
  }

  return profile;
}

export async function updateProfile(studentId: string, body: UpdateProfileBody) {
  const existing = await prisma.profile.findUnique({
    where: { studentId },
    select: { studentId: true },
  });

  if (!existing) {
    throw new AppError(404, 'Profile not found.');
  }

  const updateData: Parameters<typeof prisma.profile.update>[0]['data'] = {};

  if (body.fullName !== undefined) updateData.fullName = body.fullName;
  if (body.birthDate !== undefined) updateData.birthDate = new Date(body.birthDate);
  if (body.gender !== undefined) updateData.gender = body.gender;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.faculty !== undefined) updateData.faculty = body.faculty;
  if (body.cohort !== undefined) updateData.cohort = body.cohort;
  if (body.connectionGoal !== undefined) updateData.connectionGoal = body.connectionGoal;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;

  return prisma.profile.update({
    where: { studentId },
    data: updateData,
    include: {
      profileInterests: {
        where: { isVisible: true },
        include: {
          interest: { select: { id: true, name: true } },
        },
      },
      searchPreference: true,
    },
  });
}

export async function setInterests(studentId: string, { interestIds }: UpdateInterestsBody) {
  const profile = await prisma.profile.findUnique({
    where: { studentId },
    select: { studentId: true },
  });

  if (!profile) {
    throw new AppError(404, 'Profile not found.');
  }

  // Deduplicate incoming IDs
  const uniqueIds = Array.from(new Set(interestIds));

  if (uniqueIds.length > 0) {
    const validCount = await prisma.interest.count({
      where: {
        id: { in: uniqueIds },
        isActive: true,
      },
    });

    if (validCount !== uniqueIds.length) {
      throw new AppError(422, 'One or more interest IDs are invalid or inactive.');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.profileInterest.deleteMany({
      where: { studentId },
    });

    if (uniqueIds.length > 0) {
      await tx.profileInterest.createMany({
        data: uniqueIds.map((interestId) => ({
          studentId,
          interestId,
          isVisible: true,
        })),
      });
    }
  });

  return getProfile(studentId);
}

export async function upsertPreferences(studentId: string, body: UpdatePreferencesBody) {
  const profile = await prisma.profile.findUnique({
    where: { studentId },
    select: { studentId: true },
  });

  if (!profile) {
    throw new AppError(404, 'Profile not found.');
  }

  return prisma.searchPreference.upsert({
    where: { studentId },
    create: {
      studentId,
      ...body,
    },
    update: {
      ...body,
    },
  });
}

export async function listInterests() {
  return prisma.interest.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
