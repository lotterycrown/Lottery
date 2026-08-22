import { z } from 'zod';

export const referralCodeSchema = z.string().trim().regex(/^CROWN-[A-Z0-9]{8}$/);

export const rewardAmountMicroSchema = z.number().int().min(0);

export const tapCountSchema = z.number().int().min(0);

export const levelSchema = z.number().int().positive();

const qualificationRequirementSchema = z.object({
  minimumTaps: tapCountSchema,
  minimumLevel: levelSchema,
  completeFirstTask: z.boolean(),
});

export const referralConfigUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    referrerRewardMicro: rewardAmountMicroSchema.optional(),
    referredUserRewardMicro: rewardAmountMicroSchema.optional(),
    referrerRewardXp: rewardAmountMicroSchema.optional(),
    referredUserRewardXp: rewardAmountMicroSchema.optional(),
    qualificationRequirement: qualificationRequirementSchema.partial().optional(),
    maxReferralsPerDay: z.number().int().min(0).optional(),
  })
  .strict();
