import { z } from 'zod';

export const DiscoveryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const UpdateDiscoveryCriteriaSchema = z
  .object({
    minAge: z.number().int().min(18).max(100).optional(),
    maxAge: z.number().int().min(18).max(100).optional(),
    preferredGender: z.string().trim().max(50).nullable().optional(),
    preferredFaculty: z.string().trim().max(100).nullable().optional(),
    maxDistanceKm: z.number().int().min(1).max(1000).nullable().optional(),
    verifiedOnly: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one search criterion must be provided for update.',
  })
  .refine(
    (data) =>
      data.minAge === undefined ||
      data.maxAge === undefined ||
      data.minAge <= data.maxAge,
    {
      message: 'minAge cannot be greater than maxAge.',
    }
  );

export type DiscoveryQuery = z.infer<typeof DiscoveryQuerySchema>;
export type UpdateDiscoveryCriteria = z.infer<typeof UpdateDiscoveryCriteriaSchema>;
