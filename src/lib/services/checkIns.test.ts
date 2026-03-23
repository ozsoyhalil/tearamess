/**
 * @jest-environment node
 */
import { checkIn } from './checkIns'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  },
}))

describe('checkIn service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls insert (not upsert) on visits table', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockFrom = supabase.from as jest.MockedFunction<any>
    const mockInsert = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    await checkIn('user-1', 'place-1')

    expect(mockFrom).toHaveBeenCalledWith('visits')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', place_id: 'place-1' })
    )
  })

  it('returns { data: null, error: null } on success', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockFrom = supabase.from as jest.MockedFunction<any>
    mockFrom.mockReturnValue({ insert: jest.fn().mockResolvedValue({ error: null }) })

    const result = await checkIn('user-1', 'place-1')

    expect(result).toEqual({ data: null, error: null })
  })

  it('returns error string when Supabase fails', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockFrom = supabase.from as jest.MockedFunction<any>
    mockFrom.mockReturnValue({ insert: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }) })

    const result = await checkIn('user-1', 'place-1')

    expect(result).toEqual({ data: null, error: 'DB error' })
  })

  it('calling twice produces two insert calls (non-idempotent)', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockInsert = jest.fn().mockResolvedValue({ error: null })
    ;(supabase.from as jest.MockedFunction<any>).mockReturnValue({ insert: mockInsert })

    await checkIn('user-1', 'place-1')
    await checkIn('user-1', 'place-1')

    expect(mockInsert).toHaveBeenCalledTimes(2)
  })
})
