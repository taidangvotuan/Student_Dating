import {
  InteractionKind,
  MatchStatus,
  type PrismaClient,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export interface MatchingRepository {
  areAccountsActive(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  hasBlockBetween(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  hasReciprocalLike(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  createOrReactivateMatch(firstStudentId: string, secondStudentId: string): Promise<string>;
  cancelMatch(firstStudentId: string, secondStudentId: string): Promise<readonly string[]>;
}

function orderedPair(firstStudentId: string, secondStudentId: string) {
  const [studentAId, studentBId] = [firstStudentId, secondStudentId].sort();
  return { studentAId, studentBId };
}

export function createMatchingRepository(client: PrismaClient = prisma): MatchingRepository {
  return {
    async areAccountsActive(firstStudentId, secondStudentId) {
      const students = await client.student.findMany({
        where: { id: { in: [firstStudentId, secondStudentId] } },
        select: { id: true, accountStatus: true },
      });

      return (
        students.length === 2 &&
        students.every((student) => student.accountStatus === 'HOAT_DONG')
      );
    },

    async hasBlockBetween(firstStudentId, secondStudentId) {
      const block = await client.block.findFirst({
        where: {
          OR: [
            { blockerId: firstStudentId, blockedId: secondStudentId },
            { blockerId: secondStudentId, blockedId: firstStudentId },
          ],
        },
        select: { blockerId: true },
      });
      return block !== null;
    },

    async hasReciprocalLike(firstStudentId, secondStudentId) {
      const interaction = await client.interaction.findUnique({
        where: {
          actorId_targetId: {
            actorId: secondStudentId,
            targetId: firstStudentId,
          },
        },
        select: { kind: true },
      });
      return interaction?.kind === InteractionKind.THICH;
    },

    async createOrReactivateMatch(firstStudentId, secondStudentId) {
      const match = await client.match.upsert({
        where: { studentAId_studentBId: orderedPair(firstStudentId, secondStudentId) },
        create: { ...orderedPair(firstStudentId, secondStudentId) },
        update: { status: MatchStatus.DA_GHEP_DOI },
        select: { id: true },
      });
      return match.id;
    },

    async cancelMatch(firstStudentId, secondStudentId) {
      const matches = await client.match.updateManyAndReturn({
        where: orderedPair(firstStudentId, secondStudentId),
        data: { status: MatchStatus.DA_HUY },
        select: { id: true },
      });
      return matches.map((match) => match.id);
    },
  };
}

export const matchingRepository = createMatchingRepository();
