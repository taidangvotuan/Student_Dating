import {
  ConversationStatus,
  InteractionKind,
  MatchStatus,
  type PrismaClient,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export interface InteractionRepository {
  getActionEligibility(
    actorId: string,
    targetId: string
  ): Promise<{ actorExists: boolean; targetIsActive: boolean }>;
  hasBlockBetween(firstStudentId: string, secondStudentId: string): Promise<boolean>;
  createBlock(blockerId: string, blockedId: string): Promise<void>;
  deleteInteractionsBetween(firstStudentId: string, secondStudentId: string): Promise<void>;
  saveInteraction(actorId: string, targetId: string, kind: InteractionKind): Promise<void>;
  getInteractionKind(actorId: string, targetId: string): Promise<InteractionKind | null>;
  createOrReactivateMatch(firstStudentId: string, secondStudentId: string): Promise<string>;
  ensureConversation(matchId: string): Promise<void>;
  cancelMatchAndDeactivateConversation(
    firstStudentId: string,
    secondStudentId: string
  ): Promise<void>;
}

function orderedPair(firstStudentId: string, secondStudentId: string) {
  const [studentAId, studentBId] = [firstStudentId, secondStudentId].sort();
  return { studentAId, studentBId };
}

export function createInteractionRepository(
  client: PrismaClient = prisma
): InteractionRepository {
  return {
    async getActionEligibility(actorId, targetId) {
      const profiles = await client.profile.findMany({
        where: { studentId: { in: [actorId, targetId] } },
        select: {
          studentId: true,
          visibility: true,
          student: { select: { accountStatus: true } },
        },
      });
      const actorProfile = profiles.find((profile) => profile.studentId === actorId);
      const targetProfile = profiles.find((profile) => profile.studentId === targetId);

      return {
        actorExists: actorProfile !== undefined,
        targetIsActive:
          targetProfile?.visibility === 'CON_HOAT_DONG' &&
          targetProfile.student.accountStatus === 'HOAT_DONG',
      };
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

    async createBlock(blockerId, blockedId) {
      await client.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      });
    },

    async deleteInteractionsBetween(firstStudentId, secondStudentId) {
      await client.interaction.deleteMany({
        where: {
          OR: [
            { actorId: firstStudentId, targetId: secondStudentId },
            { actorId: secondStudentId, targetId: firstStudentId },
          ],
        },
      });
    },

    async saveInteraction(actorId, targetId, kind) {
      await client.interaction.upsert({
        where: { actorId_targetId: { actorId, targetId } },
        create: { actorId, targetId, kind },
        update: { kind },
      });
    },

    async getInteractionKind(actorId, targetId) {
      const interaction = await client.interaction.findUnique({
        where: { actorId_targetId: { actorId, targetId } },
        select: { kind: true },
      });
      return interaction?.kind ?? null;
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

    async ensureConversation(matchId) {
      await client.conversation.upsert({
        where: { matchId },
        create: { matchId },
        update: { status: ConversationStatus.HOAT_DONG },
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

export const interactionRepository = createInteractionRepository();
