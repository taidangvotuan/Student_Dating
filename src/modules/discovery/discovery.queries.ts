import { Prisma } from '@prisma/client';
import { discoveryConfig } from './discovery.config.js';

export interface ViewerDiscoveryContext {
  readonly latitude: number | null;
  readonly longitude: number | null;
}

export interface DiscoverySearchCriteria {
  readonly minAge: number;
  readonly maxAge: number;
  readonly preferredGender: string | null;
  readonly preferredFaculty: string | null;
  readonly maxDistanceKm: number | null;
  readonly verifiedOnly: boolean;
}

export interface DiscoveryFeedRow {
  readonly studentId: string;
  readonly fullName: string;
  readonly age: number;
  readonly gender: string | null;
  readonly bio: string | null;
  readonly faculty: string | null;
  readonly connectionGoal: string | null;
  readonly interests: string[];
  readonly distanceKm: number | null;
}

export function buildViewerContextQuery(studentId: string): Prisma.Sql {
  return Prisma.sql`
    SELECT
      location.latitude AS latitude,
      location.longitude AS longitude
    FROM public.profiles AS profile
    LEFT JOIN public.profile_locations AS location
      ON location.student_id = profile.student_id
    WHERE profile.student_id = ${studentId}::uuid
  `;
}

export function buildDiscoveryFeedQuery(
  studentId: string,
  criteria: DiscoverySearchCriteria,
  limit: number,
  offset: number
): Prisma.Sql {
  const { weights, distanceScoreScaleKm, newUserBoostDays } = discoveryConfig;

  return Prisma.sql`
    WITH viewer AS (
      SELECT
        profile.student_id,
        profile.birth_date,
        ${criteria.minAge}::integer AS min_age,
        ${criteria.maxAge}::integer AS max_age,
        ${criteria.preferredGender}::text AS preferred_gender,
        ${criteria.preferredFaculty}::text AS preferred_faculty,
        ${criteria.maxDistanceKm}::integer AS max_distance_km,
        ${criteria.verifiedOnly}::boolean AS verified_only,
        location.latitude,
        location.longitude,
        EXTRACT(YEAR FROM age(CURRENT_DATE, profile.birth_date))::integer AS viewer_age
      FROM public.profiles AS profile
      LEFT JOIN public.profile_locations AS location
        ON location.student_id = profile.student_id
      WHERE profile.student_id = ${studentId}::uuid
    ),
    viewer_interests AS (
      SELECT profile_interest.interest_id
      FROM public.profile_interests AS profile_interest
      INNER JOIN public.interests AS interest
        ON interest.id = profile_interest.interest_id
      WHERE profile_interest.student_id = ${studentId}::uuid
        AND profile_interest.is_visible = true
        AND interest.is_active = true
    ),
    viewer_interest_count AS (
      SELECT COUNT(*)::double precision AS interest_count
      FROM viewer_interests
    ),
    candidate_distances AS (
      SELECT
        candidate.student_id,
        candidate.full_name,
        candidate.birth_date,
        candidate.gender,
        candidate.bio,
        candidate.faculty,
        candidate.connection_goal,
        candidate.created_at,
        viewer.student_id AS viewer_id,
        viewer.min_age,
        viewer.max_age,
        viewer.preferred_gender,
        viewer.preferred_faculty,
        viewer.max_distance_km,
        viewer.verified_only,
        viewer.viewer_age,
        CASE
          WHEN viewer.latitude IS NULL OR location.latitude IS NULL THEN NULL
          ELSE ST_Distance(
            ST_SetSRID(ST_MakePoint(viewer.longitude, viewer.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(location.longitude, location.latitude), 4326)::geography
          ) / 1000.0
        END AS distance_km,
        EXTRACT(YEAR FROM age(CURRENT_DATE, candidate.birth_date))::integer AS candidate_age
      FROM public.profiles AS candidate
      INNER JOIN public.students AS student
        ON student.id = candidate.student_id
      CROSS JOIN viewer
      LEFT JOIN public.profile_locations AS location
        ON location.student_id = candidate.student_id
      WHERE candidate.student_id <> viewer.student_id
        AND candidate.visibility = 'CON_HOAT_DONG'
        AND student.account_status = 'HOAT_DONG'
    ),
    eligible_candidates AS (
      SELECT candidate.*
      FROM candidate_distances AS candidate
      WHERE candidate.candidate_age BETWEEN candidate.min_age AND candidate.max_age
        AND (
          candidate.max_distance_km IS NULL
          OR (
            candidate.distance_km IS NOT NULL
            AND candidate.distance_km <= candidate.max_distance_km
          )
        )
        /* AND (
          NOT candidate.verified_only
          OR EXISTS (
            SELECT 1
            FROM public.verifications AS verification
            WHERE verification.student_id = candidate.student_id
              AND verification.status = 'DA_XAC_THUC'
          )
        ) */
        AND NOT EXISTS (
          SELECT 1
          FROM public.interactions AS interaction
          WHERE interaction.actor_id = candidate.viewer_id
            AND interaction.target_id = candidate.student_id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.matches AS match
          WHERE match.status <> 'DA_HUY'
            AND (
              (match.student_a_id = candidate.viewer_id AND match.student_b_id = candidate.student_id)
              OR (match.student_b_id = candidate.viewer_id AND match.student_a_id = candidate.student_id)
            )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.blocks AS block
          WHERE (block.blocker_id = candidate.viewer_id AND block.blocked_id = candidate.student_id)
             OR (block.blocker_id = candidate.student_id AND block.blocked_id = candidate.viewer_id)
        )
    ),
    candidate_interest_counts AS (
      SELECT
        candidate.student_id,
        COUNT(DISTINCT interest.id)::double precision AS candidate_count,
        (COUNT(DISTINCT interest.id) FILTER (WHERE viewer_interest.interest_id IS NOT NULL))::double precision AS shared_count
      FROM eligible_candidates AS candidate
      LEFT JOIN public.profile_interests AS profile_interest
        ON profile_interest.student_id = candidate.student_id
        AND profile_interest.is_visible = true
      LEFT JOIN public.interests AS interest
        ON interest.id = profile_interest.interest_id
        AND interest.is_active = true
      LEFT JOIN viewer_interests AS viewer_interest
        ON viewer_interest.interest_id = interest.id
      GROUP BY candidate.student_id
    ),
    scored_candidates AS (
      SELECT
        candidate.*,
        COALESCE(
          interest_counts.shared_count
            / NULLIF(viewer_interest_count.interest_count + interest_counts.candidate_count - interest_counts.shared_count, 0),
          0
        ) AS interest_score,
        CASE
          WHEN candidate.distance_km IS NULL THEN 0
          ELSE GREATEST(0, 1 - candidate.distance_km / ${distanceScoreScaleKm}::double precision)
        END AS distance_score,
        CASE
          WHEN candidate.preferred_faculty IS NULL THEN 0
          WHEN candidate.faculty = candidate.preferred_faculty THEN 1
          ELSE 0
        END AS faculty_score,
        CASE
          WHEN candidate.max_age = candidate.min_age THEN 1
          ELSE GREATEST(
            0,
            1 - ABS(candidate.candidate_age - candidate.viewer_age)::double precision
              / GREATEST(candidate.max_age - candidate.min_age, 1)::double precision
          )
        END AS age_score,
        CASE
          WHEN candidate.preferred_gender IS NULL THEN 0
          WHEN candidate.gender = candidate.preferred_gender THEN 1
          ELSE 0
        END AS gender_score,
        LEAST(
          1,
          GREATEST(
            0,
            1 - EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - candidate.created_at))
              / (${newUserBoostDays}::double precision * 86400)
          )
        ) AS new_user_score
      FROM eligible_candidates AS candidate
      CROSS JOIN viewer_interest_count
      LEFT JOIN candidate_interest_counts AS interest_counts
        ON interest_counts.student_id = candidate.student_id
    ),
    ranked_candidates AS (
      SELECT
        candidate.*,
        (
          candidate.interest_score * ${weights.interests}
          + candidate.distance_score * ${weights.distance}
          + candidate.faculty_score * ${weights.faculty}
          + candidate.age_score * ${weights.age}
          + candidate.gender_score * ${weights.gender}
          + candidate.new_user_score * ${weights.newUser}
        )::double precision AS ranking_score
      FROM scored_candidates AS candidate
    )
    SELECT
      candidate.student_id::text AS "studentId",
      candidate.full_name AS "fullName",
      candidate.candidate_age AS age,
      candidate.gender,
      candidate.bio,
      candidate.faculty,
      candidate.connection_goal AS "connectionGoal",
      ARRAY(
        SELECT interest.name
        FROM public.profile_interests AS profile_interest
        INNER JOIN public.interests AS interest
          ON interest.id = profile_interest.interest_id
        WHERE profile_interest.student_id = candidate.student_id
          AND profile_interest.is_visible = true
          AND interest.is_active = true
        ORDER BY interest.name
      ) AS interests,
      ROUND(candidate.distance_km::numeric, 1)::double precision AS "distanceKm"
    FROM ranked_candidates AS candidate
    ORDER BY candidate.ranking_score DESC, candidate.created_at DESC, candidate.student_id ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
}
