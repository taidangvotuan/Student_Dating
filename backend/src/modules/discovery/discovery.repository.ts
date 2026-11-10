import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import {
  buildDiscoveryFeedQuery,
  buildViewerContextQuery,
  type DiscoverySearchCriteria,
  type DiscoveryFeedRow,
  type ViewerDiscoveryContext,
} from './discovery.queries.js';
import type { UpdateDiscoveryCriteria } from './discovery.schemas.js';

export interface DiscoveryRepository {
  findViewerContext(studentId: string): Promise<ViewerDiscoveryContext | null>;
  findSearchCriteria(studentId: string): Promise<DiscoverySearchCriteria | null>;
  updateSearchCriteria(
    studentId: string,
    criteria: UpdateDiscoveryCriteria
  ): Promise<DiscoverySearchCriteria>;
  findFeed(
    studentId: string,
    criteria: DiscoverySearchCriteria,
    limit: number,
    offset: number
  ): Promise<DiscoveryFeedRow[]>;
}

const defaultSearchCriteria: DiscoverySearchCriteria = {
  minAge: 18,
  maxAge: 100,
  preferredGender: null,
  preferredFaculty: null,
  maxDistanceKm: null,
  verifiedOnly: true,
};

function toDiscoverySearchCriteria(
  preference: {
    readonly minAge: number;
    readonly maxAge: number;
    readonly preferredGender: string | null;
    readonly preferredFaculty: string | null;
    readonly maxDistanceKm: number | null;
    readonly verifiedOnly: boolean;
  } | null
): DiscoverySearchCriteria {
  return preference ? {
    minAge: preference.minAge,
    maxAge: preference.maxAge,
    preferredGender: preference.preferredGender,
    preferredFaculty: preference.preferredFaculty,
    maxDistanceKm: preference.maxDistanceKm,
    verifiedOnly: preference.verifiedOnly,
  } : defaultSearchCriteria;
}

export function createDiscoveryRepository(
  client: PrismaClient = prisma
): DiscoveryRepository {
  return {
    async findViewerContext(studentId) {
      const [viewer] = await client.$queryRaw<ViewerDiscoveryContext[]>(
        buildViewerContextQuery(studentId)
      );
      return viewer ?? null;
    },

    async findSearchCriteria(studentId) {
      const profile = await client.profile.findUnique({
        where: { studentId },
        select: { searchPreference: true },
      });
      return profile ? toDiscoverySearchCriteria(profile.searchPreference) : null;
    },

    async updateSearchCriteria(studentId, criteria) {
      const preference = await client.searchPreference.upsert({
        where: { studentId },
        create: { studentId, ...criteria },
        update: criteria,
      });
      return toDiscoverySearchCriteria(preference);
    },

    findFeed(studentId, criteria, limit, offset) {
      return client.$queryRaw<DiscoveryFeedRow[]>(
        buildDiscoveryFeedQuery(studentId, criteria, limit, offset)
      );
    },
  };
}

export const discoveryRepository = createDiscoveryRepository();
