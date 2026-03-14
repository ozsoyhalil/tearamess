import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().min(0.5, 'Puan vermelisiniz').max(5),
  content: z.string().max(1000, 'Yorum en fazla 1000 karakter olabilir').optional(),
  visit_date: z.string().optional(),
})
export type ReviewInput = z.infer<typeof reviewSchema>
