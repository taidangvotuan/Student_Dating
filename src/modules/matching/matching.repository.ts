import {
  ConversationStatus,
  InteractionKind,
  MatchStatus,
  type PrismaClient,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export interface MatchingRepository {
  areAccountsActive(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  hasBlockBetween(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  hasReciprocalLike(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  createOrReactivateMatch(firstStudentId: string, secondStudentId: string): Promise<void>;
  cancelMatchAndDeactivateConversation(
    firstStudentId: string,
    secondStudentId: string
  ): Promise<void>;
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
      await client.match.upsert({
        where: { studentAId_studentBId: orderedPair(firstStudentId, secondStudentId) },
        create: { ...orderedPair(firstStudentId, secondStudentId) },
        update: { status: MatchStatus.DA_GHEP_DOI },
        select: { id: true },
      });
    },

    async cancelMatchAndDeactivateConversation(firstStudentId, secondStudentId) {
      const matches = await client.match.updateManyAndReturn({
        where: orderedPair(firstStudentId, secondStudentId),
        data: { status: MatchStatus.DA_HUY },
        select: { id: true },
      });

      if (matches.length === 0) {
        return;
      }

      await client.conversation.updateMany({
        where: { matchId: { in: matches.map((match) => match.id) } },
        data: { status: ConversationStatus.KHONG_HOAT_DONG },
      });
    },
  };
}

export const matchingRepository = createMatchingRepository();
