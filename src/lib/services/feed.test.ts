/**
 * @jest-environment node
 */
// SOCL-03: Social graph — feed service stubs (RED — feed.ts does not exist yet)
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { getFeed } from './feed'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  jest.clearAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

describe('getFeed', () => {
  it('returns { data: [], error: null } when user follows no one', async () => {
    // follows lookup returns empty list — no feed items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ data: [], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getFeed('user-id')
    expect(result.data).toEqual([])
    expect(result.error).toBeNull()
  })

  it('returns FeedItem[] sorted by created_at descending when user follows others', async () => {
    const followIds = [{ following_id: 'u1' }, { following_id: 'u2' }]
    const reviewItems = [
      {
        id: 'review-1',
        user_id: 'u2',
        place_id: 'p1',
        rating: 4,
        content: 'Nice place',
        created_at: '2024-02-01T12:00:00Z',
        profiles: { username: 'alice', display_name: 'Alice', avatar_url: null },
        places: { id: 'p1', name: 'Cafe', slug: 'cafe', category: 'cafe' },
      },
    ]
    const visitItems = [
      {
        id: 'visit-1',
        user_id: 'u1',
        place_id: 'p1',
        created_at: '2024-01-01T12:00:00Z',
        profiles: { username: 'bob', display_name: 'Bob', avatar_url: null },
        places: { id: 'p1', name: 'Cafe', slug: 'cafe', category: 'cafe' },
      },
    ]

    // First from('follows') call — follows lookup via eq
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followsEqFn = jest.fn() as jest.MockedFunction<any>
    followsEqFn.mockResolvedValue({ data: followIds, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followsSelectFn = jest.fn() as jest.MockedFunction<any>
    followsSelectFn.mockReturnValue({ eq: followsEqFn })

    // Reviews query: from('reviews').select(...).in(...).order(...)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsOrderFn = jest.fn() as jest.MockedFunction<any>
    reviewsOrderFn.mockResolvedValue({ data: reviewItems, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsInFn = jest.fn() as jest.MockedFunction<any>
    reviewsInFn.mockReturnValue({ order: reviewsOrderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsSelectFn = jest.fn() as jest.MockedFunction<any>
    reviewsSelectFn.mockReturnValue({ in: reviewsInFn })

    // Visits query: from('visits').select(...).in(...).order(...)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsOrderFn = jest.fn() as jest.MockedFunction<any>
    visitsOrderFn.mockResolvedValue({ data: visitItems, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsInFn = jest.fn() as jest.MockedFunction<any>
    visitsInFn.mockReturnValue({ order: visitsOrderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsSelectFn = jest.fn() as jest.MockedFunction<any>
    visitsSelectFn.mockReturnValue({ in: visitsInFn })

    mockFrom()
      .mockReturnValueOnce({ select: followsSelectFn })
      .mockReturnValueOnce({ select: reviewsSelectFn })
      .mockReturnValueOnce({ select: visitsSelectFn })

    const result = await getFeed('user-id')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data![0].created_at > result.data![1].created_at).toBe(true)
    expect(['visit', 'review']).toContain(result.data![0].type)
  })

  it('returns only items older than cursor timestamp when cursor is provided', async () => {
    const cursor = '2024-01-15T00:00:00Z'
    const followIds = [{ following_id: 'u1' }]
    const olderReview = {
      id: 'review-old',
      user_id: 'u1',
      place_id: 'p1',
      rating: 3,
      content: null,
      created_at: '2024-01-01T12:00:00Z',
      profiles: { username: 'bob', display_name: 'Bob', avatar_url: null },
      places: { id: 'p1', name: 'Cafe', slug: 'cafe', category: 'cafe' },
    }

    // First from('follows') call — follows lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followsEqFn = jest.fn() as jest.MockedFunction<any>
    followsEqFn.mockResolvedValue({ data: followIds, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followsSelectFn = jest.fn() as jest.MockedFunction<any>
    followsSelectFn.mockReturnValue({ eq: followsEqFn })

    // Reviews query with cursor: from('reviews').select(...).in(...).order(...).lt(...)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsLtFn = jest.fn() as jest.MockedFunction<any>
    reviewsLtFn.mockResolvedValue({ data: [olderReview], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsOrderFn = jest.fn() as jest.MockedFunction<any>
    reviewsOrderFn.mockReturnValue({ lt: reviewsLtFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsInFn = jest.fn() as jest.MockedFunction<any>
    reviewsInFn.mockReturnValue({ order: reviewsOrderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsSelectFn = jest.fn() as jest.MockedFunction<any>
    reviewsSelectFn.mockReturnValue({ in: reviewsInFn })

    // Visits query with cursor: from('visits').select(...).in(...).order(...).lt(...)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsLtFn = jest.fn() as jest.MockedFunction<any>
    visitsLtFn.mockResolvedValue({ data: [], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsOrderFn = jest.fn() as jest.MockedFunction<any>
    visitsOrderFn.mockReturnValue({ lt: visitsLtFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsInFn = jest.fn() as jest.MockedFunction<any>
    visitsInFn.mockReturnValue({ order: visitsOrderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitsSelectFn = jest.fn() as jest.MockedFunction<any>
    visitsSelectFn.mockReturnValue({ in: visitsInFn })

    mockFrom()
      .mockReturnValueOnce({ select: followsSelectFn })
      .mockReturnValueOnce({ select: reviewsSelectFn })
      .mockReturnValueOnce({ select: visitsSelectFn })

    const result = await getFeed('user-id', cursor)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.every((item) => item.created_at < cursor)).toBe(true)
  })
})
