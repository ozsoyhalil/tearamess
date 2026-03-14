// INFRA-01: Service layer — places
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { getPlaces, searchPlaces } from './places'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  jest.clearAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

describe('getPlaces', () => {
  it('returns { data: Place[], error: null } on success', async () => {
    const rawPlaces = [
      {
        id: '1',
        name: 'Test Kafe',
        slug: 'test-kafe',
        category: 'Kafe',
        city: 'Ankara',
        neighborhood: 'Çankaya',
        reviews: [{ rating: 4 }, { rating: 5 }],
      },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockResolvedValue({ data: rawPlaces, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ order: orderFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getPlaces()
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data![0].id).toBe('1')
    expect(result.data![0].avg_rating).toBe(4.5)
    expect(result.data![0].review_count).toBe(2)
  })

  it('returns { data: null, error: string } on Supabase error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ order: orderFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getPlaces()
    expect(result.data).toBeNull()
    expect(result.error).toBe('DB error')
  })
})

describe('searchPlaces', () => {
  it('returns matching places for a query string', async () => {
    const hits = [
      { id: '2', name: 'Ankara Kafe', slug: 'ankara-kafe', category: 'Kafe', city: 'Ankara' },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const limitFn = jest.fn() as jest.MockedFunction<any>
    limitFn.mockResolvedValue({ data: hits, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ilikeFn = jest.fn() as jest.MockedFunction<any>
    ilikeFn.mockReturnValue({ limit: limitFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ ilike: ilikeFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await searchPlaces('Ankara')
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data![0].name).toBe('Ankara Kafe')
  })

  it('returns empty array when no matches', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const limitFn = jest.fn() as jest.MockedFunction<any>
    limitFn.mockResolvedValue({ data: [], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ilikeFn = jest.fn() as jest.MockedFunction<any>
    ilikeFn.mockReturnValue({ limit: limitFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ ilike: ilikeFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await searchPlaces('notfound')
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(0)
  })
})
