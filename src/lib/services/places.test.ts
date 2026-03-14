// INFRA-01: Service layer — places
// These stubs are filled by plan 01-02 (service layer implementation)
import { jest } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('getPlaces', () => {
  it.todo('returns { data: Place[], error: null } on success')
  it.todo('returns { data: null, error: string } on Supabase error')
})

describe('searchPlaces', () => {
  it.todo('returns matching places for a query string')
  it.todo('returns empty array when no matches')
})
