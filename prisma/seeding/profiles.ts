import process from 'node:process';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../src/database/prisma.js';

const faculties = [
  'Khoa học Máy tính',
  'Kỹ thuật Máy tính',
  'Công nghệ Phần mềm',
  'Hệ thống Thông tin',
  'Mạng máy tính và Truyền thông',
  'Khoa học và Kỹ thuật Thông tin',
];

const cohorts = [
  'K17',
  'K18',
  'K19',
  'K20',
  'K21',
];

import { faker } from '@faker-js/faker';

export interface SeedProfileData {
  readonly fullName: string;
  readonly birthDate: Date;
  readonly gender: string;
  readonly faculty: string;
  readonly cohort: string;
  readonly bio: string;
  readonly connectionGoal: string;
  readonly visibility: 'CON_HOAT_DONG';
}

export function generateProfileData(
  index: number,
  faculties: readonly string[],
  cohorts: readonly string[]
): SeedProfileData {
  faker.seed(20261103 + index);

  return {
    fullName: faker.person.fullName(),
    birthDate: faker.date.birthdate({ min: 18, max: 30, mode: 'age' }),
    gender: faker.helpers.arrayElement(['Nam', 'Nữ', 'Khác']),
    faculty: faker.helpers.arrayElement(faculties),
    cohort: faker.helpers.arrayElement(cohorts),
    bio: '',
    connectionGoal: '',
    visibility: 'CON_HOAT_DONG',
  };
}

const PROFILE_COUNT = 150;

async function seedProfiles(): Promise<void> {
  console.log(`Seeding ${PROFILE_COUNT} profiles in the verified test project...`);
  const studentsIds = Array.from({ length: PROFILE_COUNT }, () => uuidv4());

  const students = await prisma.student.createMany({
    data: studentsIds.map((id) => ({ 
      id, 
      accountStatus: 'HOAT_DONG', 
    })),
    skipDuplicates: true,
  });

  await prisma.$transaction(
    studentsIds.map((id, index) => {
      const profile = generateProfileData(index, faculties, cohorts);
      return prisma.profile.upsert({
        where: { studentId: id },
        create: {
          studentId: id,
          ...profile,
        },
        update: profile,
      });
    })
  );

  console.log(`Seeded ${students.count} profiles.`);
}

seedProfiles()
  .catch((error: unknown) => {
    console.error('Profile seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
