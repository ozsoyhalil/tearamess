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
    const feedItems = [
      {
        id: 'item-2',
        type: 'review' as const,
        user_id: 'u2',
        place_id: 'p1',
        created_at: '2024-02-01T12:00:00Z',
      },
      {
        id: 'item-1',
        type: 'visit' as const,
        user_id: 'u1',
        place_id: 'p1',
        created_at: '2024-01-01T12:00:00Z',
      },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockResolvedValue({ data: feedItems, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inFn = jest.fn() as jest.MockedFunction<any>
    inFn.mockReturnValue({ order: orderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ in: inFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getFeed('user-id')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data![0].created_at > result.data![1].created_at).toBe(true)
    expect(['visit', 'review']).toContain(result.data![0].type)
  })

  it('returns only items older than cursor timestamp when cursor is provided', async () => {
    const cursor = '2024-01-15T00:00:00Z'
    const olderItem = {
      id: 'item-old',
      type: 'visit' as const,
      user_id: 'u1',
      place_id: 'p1',
      created_at: '2024-01-01T12:00:00Z',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ltFn = jest.fn() as jest.MockedFunction<any>
    ltFn.mockResolvedValue({ data: [olderItem], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockReturnValue({ lt: ltFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inFn = jest.fn() as jest.MockedFunction<any>
    inFn.mockReturnValue({ order: orderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ in: inFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getFeed('user-id', cursor)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.every((item) => item.created_at < cursor)).toBe(true)
  })
})
