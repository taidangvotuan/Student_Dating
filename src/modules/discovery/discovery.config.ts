import { z } from 'zod';

const DiscoveryConfigSchema = z.object({
  weights: z.object({
    interests: z.number().nonnegative(),
    distance: z.number().nonnegative(),
    faculty: z.number().nonnegative(),
    age: z.number().nonnegative(),
    gender: z.number().nonnegative(),
    newUser: z.number().nonnegative(),
  }),
  distanceScoreScaleKm: z.number().positive(),
  newUserBoostDays: z.number().int().positive(),
});

export const discoveryConfig = DiscoveryConfigSchema.parse({
  weights: {
    interests: 0.3,
    distance: 0.2,
    faculty: 0.15,
    age: 0.15,
    gender: 0.1,
    newUser: 0.1,
  },
  distanceScoreScaleKm: 50,
  newUserBoostDays: 14,
});
