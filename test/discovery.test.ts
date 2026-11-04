import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiscoveryFeedQuery,
  type DiscoverySearchCriteria,
} from '../src/modules/discovery/discovery.queries.js';
import {
  DiscoveryQuerySchema,
  UpdateDiscoveryCriteriaSchema,
} from '../src/modules/discovery/discovery.schemas.js';
import { createDiscoveryService } from '../src/modules/discovery/discovery.service.js';
import type { DiscoveryRepository } from '../src/modules/discovery/discovery.repository.js';
import type { DiscoveryFeedRow } from '../src/modules/discovery/discovery.queries.js';
import { AppError } from '../src/shared/errors/AppError.js';

function createDiscoveryRepository(
  overrides: Partial<DiscoveryRepository> = {}
): DiscoveryRepository {
  return {
    findViewerContext: async () => ({
      latitude: null,
      longitude: null,
    }),
    findSearchCriteria: async () => ({
      minAge: 18,
      maxAge: 100,
      preferredGender: null,
      preferredFaculty: null,
      maxDistanceKm: null,
      verifiedOnly: true,
    }),
    updateSearchCriteria: async (_studentId, criteria) => ({
      minAge: 18,
      maxAge: 100,
      preferredGender: null,
      preferredFaculty: null,
      maxDistanceKm: null,
      verifiedOnly: true,
      ...criteria,
    }),
    findFeed: async () => [],
    ...overrides,
  };
}

describe('Discovery query validation', () => {
  it('uses bounded defaults when pagination parameters are omitted', () => {
    assert.deepEqual(DiscoveryQuerySchema.parse({}), { limit: 20, offset: 0 });
  });

  it('rejects pagination outside the supported bounds', () => {
    assert.equal(DiscoveryQuerySchema.safeParse({ limit: 51 }).success, false);
    assert.equal(DiscoveryQuerySchema.safeParse({ offset: -1 }).success, false);
  });

  it('accepts partial criteria updates, including clearing nullable filters', () => {
    assert.deepEqual(
      UpdateDiscoveryCriteriaSchema.parse({ preferredGender: null }),
      { preferredGender: null }
    );
    assert.equal(UpdateDiscoveryCriteriaSchema.safeParse({}).success, false);
    assert.equal(
      UpdateDiscoveryCriteriaSchema.safeParse({ minAge: 30, maxAge: 20 }).success,
      false
    );
  });
});

describe('Discovery feed query', () => {
  it('applies mandatory profile, interaction, match, block, age, and distance exclusions', () => {
    const query = buildDiscoveryFeedQuery(
      '00000000-0000-0000-0000-000000000001',
      defaultCriteria,
      21,
      0
    );

    assert.match(query.sql, /candidate\.visibility = 'CON_HOAT_DONG'/);
    assert.match(query.sql, /student\.account_status = 'HOAT_DONG'/);
    assert.match(query.sql, /candidate_age BETWEEN candidate\.min_age AND candidate\.max_age/);
    assert.match(query.sql, /candidate\.distance_km <= candidate\.max_distance_km/);
    assert.match(query.sql, /ST_Distance\(/);
    assert.match(query.sql, /ST_MakePoint\(viewer\.longitude, viewer\.latitude\)/);
    assert.match(query.sql, /ST_MakePoint\(location\.longitude, location\.latitude\)/);
    assert.match(query.sql, /::geography/);
    assert.doesNotMatch(query.sql, /ASIN\(SQRT/);
    assert.match(query.sql, /FROM public\.interactions AS interaction/);
    assert.match(query.sql, /FROM public\.matches AS match/);
    assert.match(query.sql, /FROM public\.blocks AS block/);
    assert.match(query.sql, /FROM public\.verifications AS verification/);
    assert.doesNotMatch(query.sql, /search_preferences/);
    assert.match(query.sql, /candidate\.ranking_score DESC/);
  });

  it('binds viewer and pagination values instead of embedding them in SQL text', () => {
    const viewerId = "00000000-0000-0000-0000-000000000001' OR true --";
    const criteria = { ...defaultCriteria, preferredFaculty: 'Faculty' };
    const query = buildDiscoveryFeedQuery(viewerId, criteria, 20, 10);

    assert.equal(query.sql.includes(viewerId), false);
    assert.ok(query.values.includes(viewerId));
    assert.ok(query.values.includes(criteria.preferredFaculty));
    assert.ok(query.values.includes(criteria.minAge));
    assert.ok(query.values.includes(criteria.maxDistanceKm));
    assert.ok(query.values.includes(20));
    assert.ok(query.values.includes(10));
  });

  it('calculates every configured ranking component, including the decaying new-user boost', () => {
    const query = buildDiscoveryFeedQuery(
      '00000000-0000-0000-0000-000000000001',
      defaultCriteria,
      20,
      0
    );

    assert.match(query.sql, /candidate\.interest_score \*/);
    assert.match(query.sql, /candidate\.distance_score \*/);
    assert.match(query.sql, /candidate\.faculty_score \*/);
    assert.match(query.sql, /candidate\.age_score \*/);
    assert.match(query.sql, /candidate\.gender_score \*/);
    assert.match(query.sql, /candidate\.new_user_score \*/);
    assert.match(query.sql, /CURRENT_TIMESTAMP - candidate\.created_at/);
    assert.ok([0.3, 0.2, 0.15, 0.1].every((weight) => query.values.includes(weight)));
  });
});

describe('DiscoveryService', () => {
  it('returns search criteria for the authenticated profile', async () => {
    const service = createDiscoveryService(
      createDiscoveryRepository({
        findSearchCriteria: async () => ({
          ...defaultCriteria,
          maxAge: 25,
        }),
      })
    );

    assert.deepEqual(await service.getSearchCriteria('viewer-id'), {
      ...defaultCriteria,
      maxAge: 25,
    });
  });

  it('updates search criteria while preserving omitted values and validating the combined age range', async () => {
    let updatedCriteria: Partial<DiscoverySearchCriteria> | undefined;
    const service = createDiscoveryService(
      createDiscoveryRepository({
        findSearchCriteria: async () => ({ ...defaultCriteria, maxAge: 25 }),
        updateSearchCriteria: async (_studentId, criteria) => {
          updatedCriteria = criteria;
          return { ...defaultCriteria, maxAge: 25, ...criteria };
        },
      })
    );

    await assert.rejects(
      () => service.updateSearchCriteria('viewer-id', { minAge: 30 }),
      (error: unknown) => error instanceof AppError && error.statusCode === 422
    );
    assert.equal(updatedCriteria, undefined);

    const updated = await service.updateSearchCriteria('viewer-id', {
      preferredGender: null,
      maxAge: 30,
    });
    assert.deepEqual(updated, {
      ...defaultCriteria,
      maxAge: 30,
      preferredGender: null,
    });
  });

  it('returns a not-found error when the viewer has no profile', async () => {
    const repository = createDiscoveryRepository({
      findSearchCriteria: async () => null,
    });
    const service = createDiscoveryService(repository);

    await assert.rejects(
      () => service.getDiscoveryFeed('viewer-id', 20, 0),
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it('requires viewer coordinates when a maximum distance is configured', async () => {
    let feedWasQueried = false;
    const service = createDiscoveryService(
      createDiscoveryRepository({
        findSearchCriteria: async () => ({ ...defaultCriteria, maxDistanceKm: 20 }),
        findViewerContext: async () => ({
          latitude: null,
          longitude: null,
        }),
        findFeed: async () => {
          feedWasQueried = true;
          return [];
        },
      })
    );

    await assert.rejects(
      () => service.getDiscoveryFeed('viewer-id', 20, 0),
      (error: unknown) => error instanceof AppError && error.statusCode === 422
    );
    assert.equal(feedWasQueried, false);
  });

  it('fetches one extra row to determine whether another page exists', async () => {
    let requestedLimit = 0;
    let receivedCriteria: DiscoverySearchCriteria | undefined;
    const rows: DiscoveryFeedRow[] = [
      {
        studentId: 'candidate-1',
        fullName: 'Student One',
        age: 20,
        gender: null,
        bio: null,
        faculty: null,
        connectionGoal: null,
        interests: [],
        distanceKm: null,
      },
      {
        studentId: 'candidate-2',
        fullName: 'Student Two',
        age: 21,
        gender: null,
        bio: null,
        faculty: null,
        connectionGoal: null,
        interests: [],
        distanceKm: null,
      },
    ];
    const service = createDiscoveryService(
      createDiscoveryRepository({
        findFeed: async (_studentId, criteria, limit) => {
          requestedLimit = limit;
          receivedCriteria = criteria;
          return rows;
        },
      })
    );

    const result = await service.getDiscoveryFeed('viewer-id', 1, 0);

    assert.equal(requestedLimit, 2);
    assert.deepEqual(receivedCriteria, defaultCriteria);
    assert.deepEqual(result, { items: [rows[0]], hasMore: true });
  });
});

const defaultCriteria: DiscoverySearchCriteria = {
  minAge: 18,
  maxAge: 100,
  preferredGender: null,
  preferredFaculty: null,
  maxDistanceKm: null,
  verifiedOnly: true,
};
