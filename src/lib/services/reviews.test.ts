// INFRA-01: Service layer — reviews
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { getReviewsForPlace, createReview } from './reviews'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  jest.clearAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

describe('getReviewsForPlace', () => {
  it('returns reviews array for a given place_id', async () => {
    const reviewData = [
      {
        id: 'r1',
        place_id: 'p1',
        user_id: 'u1',
        rating: 4,
        content: 'Great place',
        visit_date: null,
        created_at: '2024-01-01',
        profiles: { username: 'testuser', display_name: 'Test User' },
      },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockResolvedValue({ data: reviewData, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ order: orderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getReviewsForPlace('p1')
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data![0].id).toBe('r1')
    expect(result.data![0].content).toBe('Great place')
  })

  it('returns { data: null, error: string } on Supabase error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockResolvedValue({ data: null, error: { message: 'fetch error' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ order: orderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getReviewsForPlace('p1')
    expect(result.data).toBeNull()
    expect(result.error).toBe('fetch error')
  })
})

describe('createReview', () => {
  it('inserts review and returns { data: null, error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: null })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await createReview({
      place_id: 'p1',
      user_id: 'u1',
      rating: 4,
      content: 'Nice',
      visit_date: null,
    })
    expect(result.data).toBeNull()
    expect(result.error).toBeNull()
  })

  it('returns { data: null, error: string } on insert failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: { message: 'insert failed' } })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await createReview({
      place_id: 'p1',
      user_id: 'u1',
      rating: 4,
      content: null,
      visit_date: null,
    })
    expect(result.data).toBeNull()
    expect(result.error).toBe('insert failed')
  })
})
