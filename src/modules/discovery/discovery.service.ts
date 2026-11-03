import { AppError } from '../../shared/errors/AppError.js';
import {
  discoveryRepository,
  type DiscoveryRepository,
} from './discovery.repository.js';
import type { UpdateDiscoveryCriteria } from './discovery.schemas.js';

export function createDiscoveryService(repository: DiscoveryRepository) {
  async function getSearchCriteria(studentId: string) {
    const criteria = await repository.findSearchCriteria(studentId);

    if (!criteria) {
      throw new AppError(404, 'Profile not found.');
    }

    return criteria;
  }

  async function updateSearchCriteria(
    studentId: string,
    criteria: UpdateDiscoveryCriteria
  ) {
    const currentCriteria = await getSearchCriteria(studentId);
    const minAge = criteria.minAge ?? currentCriteria.minAge;
    const maxAge = criteria.maxAge ?? currentCriteria.maxAge;

    if (minAge > maxAge) {
      throw new AppError(422, 'minAge cannot be greater than maxAge.');
    }

    return repository.updateSearchCriteria(studentId, criteria);
  }

  async function getDiscoveryFeed(studentId: string, limit: number, offset: number) {
    const criteria = await getSearchCriteria(studentId);
    const viewer = await repository.findViewerContext(studentId);

    if (!viewer) {
      throw new AppError(404, 'Profile not found.');
    }

    if (criteria.maxDistanceKm !== null && (viewer.latitude === null || viewer.longitude === null)) {
      throw new AppError(422, 'A location is required when maxDistanceKm is set.');
    }

    const rows = await repository.findFeed(studentId, criteria, limit + 1, offset);
    const hasMore = rows.length > limit;

    return {
      items: hasMore ? rows.slice(0, limit) : rows,
      hasMore,
    };
  }

  return { getSearchCriteria, updateSearchCriteria, getDiscoveryFeed };
}

const discoveryService = createDiscoveryService(discoveryRepository);

export const getDiscoveryFeed = discoveryService.getDiscoveryFeed;
export const getSearchCriteria = discoveryService.getSearchCriteria;
export const updateSearchCriteria = discoveryService.updateSearchCriteria;
