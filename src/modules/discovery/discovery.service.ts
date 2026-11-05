import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import {
  discoveryRepository,
  type DiscoveryRepository,
} from './discovery.repository.js';
import type { UpdateDiscoveryCriteria } from './discovery.schemas.js';

export function createDiscoveryService(repository: DiscoveryRepository) {
  async function loadSearchCriteria(studentId: string) {
    const criteria = await repository.findSearchCriteria(studentId);

    if (!criteria) {
      throw new AppError(404, 'Profile not found.');
    }

    return criteria;
  }

  async function getSearchCriteria(studentId: string) {
    const criteria = await loadSearchCriteria(studentId);
    logger.info('[Discovery Service] Get search criteria success', {
      action: 'discovery.criteria.retrieved',
      studentId,
    });
    return criteria;
  }

  async function updateSearchCriteria(
    studentId: string,
    criteria: UpdateDiscoveryCriteria
  ) {
    const currentCriteria = await loadSearchCriteria(studentId);
    const minAge = criteria.minAge ?? currentCriteria.minAge;
    const maxAge = criteria.maxAge ?? currentCriteria.maxAge;

    if (minAge > maxAge) {
      throw new AppError(422, 'minAge cannot be greater than maxAge.');
    }

    const updatedCriteria = await repository.updateSearchCriteria(studentId, criteria);
    logger.info('[Discovery Service] Update search criteria success', {
      action: 'discovery.criteria.updated',
      studentId,
      updatedFields: Object.keys(criteria),
    });
    return updatedCriteria;
  }

  async function getDiscoveryFeed(studentId: string, limit: number, offset: number) {
    const criteria = await loadSearchCriteria(studentId);
    const viewer = await repository.findViewerContext(studentId);

    if (!viewer) {
      throw new AppError(404, 'Profile not found.');
    }

    if (criteria.maxDistanceKm !== null && (viewer.latitude === null || viewer.longitude === null)) {
      throw new AppError(422, 'A location is required when maxDistanceKm is set.');
    }

    const rows = await repository.findFeed(studentId, criteria, limit + 1, offset);
    const hasMore = rows.length > limit;

    const result = {
      items: hasMore ? rows.slice(0, limit) : rows,
      hasMore,
    };
    logger.info('[Discovery Service] Get discovery feed success', {
      action: 'discovery.feed.retrieved',
      studentId,
      limit,
      offset,
      returnedCount: result.items.length,
      hasMore: result.hasMore,
    });
    return result;
  }

  return { getSearchCriteria, updateSearchCriteria, getDiscoveryFeed };
}

const discoveryService = createDiscoveryService(discoveryRepository);

export const getDiscoveryFeed = discoveryService.getDiscoveryFeed;
export const getSearchCriteria = discoveryService.getSearchCriteria;
export const updateSearchCriteria = discoveryService.updateSearchCriteria;
