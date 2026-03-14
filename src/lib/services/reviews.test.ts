// INFRA-01: Service layer — reviews
import { jest } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('getReviewsForPlace', () => {
  it.todo('returns reviews array for a given place_id')
  it.todo('returns { data: null, error: string } on Supabase error')
})

describe('createReview', () => {
  it.todo('inserts review and returns { data: null, error: null } on success')
  it.todo('returns { data: null, error: string } on insert failure')
})
