import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name cannot be empty.').max(200).optional(),
    birthDate: z.string().date('Birth date must be a valid ISO date YYYY-MM-DD.').optional(),
    gender: z.string().trim().max(50).optional(),
    bio: z.string().trim().max(2000, 'Bio cannot exceed 2000 characters.').optional(),
    faculty: z.string().trim().max(100).optional(),
    cohort: z.string().trim().max(50).optional(),
    connectionGoal: z.string().trim().max(100).optional(),
    visibility: z.enum(['CON_HOAT_DONG', 'BI_AN'], {
      message: 'Visibility can only be updated to CON_HOAT_DONG or BI_AN.',
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field must be provided for update.',
  });

export const UpdateInterestsSchema = z.object({
  interestIds: z
    .array(z.string().uuid('Each interest ID must be a valid UUID.'))
    .max(20, 'Cannot select more than 20 interests.'),
});

export const UpdatePreferencesSchema = z
  .object({
    minAge: z.number().int().min(18).max(100).optional(),
    maxAge: z.number().int().min(18).max(100).optional(),
    preferredGender: z.string().trim().max(50).optional(),
    preferredFaculty: z.string().trim().max(100).optional(),
    maxDistanceKm: z.number().int().min(1).max(1000).optional(),
    verifiedOnly: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.minAge !== undefined && data.maxAge !== undefined) {
        return data.minAge <= data.maxAge;
      }
      return true;
    },
    {
      message: 'minAge cannot be greater than maxAge.',
    }
  );

export type UpdateProfileBody = z.infer<typeof UpdateProfileSchema>;
export type UpdateInterestsBody = z.infer<typeof UpdateInterestsSchema>;
export type UpdatePreferencesBody = z.infer<typeof UpdatePreferencesSchema>;
