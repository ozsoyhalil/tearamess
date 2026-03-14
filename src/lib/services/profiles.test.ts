/**
 * @jest-environment node
 */
// INFRA-01: Service layer — profiles
// SOCL-04: Extended with getProfileByUsername stubs (RED — function not yet implemented)
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { getProfileByUserId, getProfileByUsername } from './profiles'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  jest.clearAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

describe('getProfileByUserId', () => {
  it('returns { data: Profile, error: null } on success', async () => {
    const profileData = { username: 'testuser', display_name: 'Test User', avatar_url: null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: profileData, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getProfileByUserId('user-id')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.username).toBe('testuser')
  })

  it('returns { data: null, error: string } on Supabase error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: null, error: { message: 'not found' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getProfileByUserId('user-id')
    expect(result.data).toBeNull()
    expect(result.error).toBe('not found')
  })
})

describe('getProfileByUsername', () => {
  it('returns { data: Profile, error: null } for a valid username', async () => {
    const profileData = { username: 'alice', display_name: 'Alice', avatar_url: null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: profileData, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getProfileByUsername('alice')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.username).toBe('alice')
  })

  it('returns { data: null, error: "Kullanıcı bulunamadı" } for an unknown username', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: null, error: { message: 'Kullanıcı bulunamadı' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getProfileByUsername('unknown-user')
    expect(result.data).toBeNull()
    expect(result.error).toBe('Kullanıcı bulunamadı')
  })
})
