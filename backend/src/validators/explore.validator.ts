import { z } from 'zod'
import { CATEGORY_SLUGS } from '../constants/categories'
import { ExploreError } from '../utils/ExploreError'

const rewardAmount = z
  .string()
  .regex(/^\d{1,3}(?:\.\d{1,2})?$/, 'La prime doit être un montant en euros.')
  .transform((value) => Math.round(Number(value) * 100))

const exploreQuerySchema = z
  .strictObject({
    q: z.string().trim().max(80).optional(),
    category: z.enum(CATEGORY_SLUGS).optional(),
    minReward: rewardAmount.optional(),
    maxReward: rewardAmount.optional(),
    sort: z.enum(['date_desc', 'date_asc', 'reward_asc', 'reward_desc']).default('date_desc'),
  })
  .superRefine((query, context) => {
    if (query.q && query.q.length === 1) {
      context.addIssue({
        code: 'custom',
        path: ['q'],
        message: 'La recherche doit contenir au moins deux caractères.',
      })
    }
    if (query.minReward !== undefined && query.maxReward !== undefined && query.minReward > query.maxReward) {
      context.addIssue({
        code: 'custom',
        path: ['maxReward'],
        message: 'La prime maximale doit être supérieure ou égale à la prime minimale.',
      })
    }
  })

export type ExploreQuery = z.infer<typeof exploreQuerySchema>

export function parseExploreQuery(input: unknown): ExploreQuery {
  const result = exploreQuerySchema.safeParse(input)
  if (!result.success) {
    throw new ExploreError(400, 'INVALID_INPUT', 'Les filtres de recherche sont invalides.')
  }
  return result.data
}
