/**
 * @jest-environment node
 */
// SOCL-01, SOCL-02: Social graph — follows service stubs (RED — follows.ts does not exist yet)
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowerCount,
  getFollowers,
  getFollowing,
} from './follows'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  jest.clearAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

describe('followUser', () => {
  it('inserts a follow row and returns { data: null, error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: null })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await followUser('follower-id', 'following-id')
    expect(result.data).toBeNull()
    expect(result.error).toBeNull()
  })

  it('returns { data: null, error: string } when supabase insert fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: { message: 'insert failed' } })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await followUser('follower-id', 'following-id')
    expect(result.data).toBeNull()
    expect(result.error).toBe('insert failed')
  })
})

describe('unfollowUser', () => {
  it('deletes the follow row and returns { data: null, error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn2 = jest.fn() as jest.MockedFunction<any>
    eqFn2.mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn1 = jest.fn() as jest.MockedFunction<any>
    eqFn1.mockReturnValue({ eq: eqFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteFn = jest.fn() as jest.MockedFunction<any>
    deleteFn.mockReturnValue({ eq: eqFn1 })
    mockFrom().mockReturnValue({ delete: deleteFn })

    const result = await unfollowUser('follower-id', 'following-id')
    expect(result.data).toBeNull()
    expect(result.error).toBeNull()
  })

  it('returns { data: null, error: string } when supabase delete fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn2 = jest.fn() as jest.MockedFunction<any>
    eqFn2.mockResolvedValue({ error: { message: 'delete failed' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn1 = jest.fn() as jest.MockedFunction<any>
    eqFn1.mockReturnValue({ eq: eqFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteFn = jest.fn() as jest.MockedFunction<any>
    deleteFn.mockReturnValue({ eq: eqFn1 })
    mockFrom().mockReturnValue({ delete: deleteFn })

    const result = await unfollowUser('follower-id', 'following-id')
    expect(result.data).toBeNull()
    expect(result.error).toBe('delete failed')
  })
})

describe('isFollowing', () => {
  it('returns { data: true, error: null } when a follow row exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn2 = jest.fn() as jest.MockedFunction<any>
    eqFn2.mockResolvedValue({ data: { follower_id: 'follower-id', following_id: 'following-id' }, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn1 = jest.fn() as jest.MockedFunction<any>
    eqFn1.mockReturnValue({ eq: eqFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn1 })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await isFollowing('follower-id', 'following-id')
    expect(result.data).toBe(true)
    expect(result.error).toBeNull()
  })

  it('returns { data: false, error: null } when no follow row exists (not following)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn2 = jest.fn() as jest.MockedFunction<any>
    eqFn2.mockResolvedValue({ data: null, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn1 = jest.fn() as jest.MockedFunction<any>
    eqFn1.mockReturnValue({ eq: eqFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn1 })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await isFollowing('follower-id', 'following-id')
    expect(result.data).toBe(false)
    expect(result.error).toBeNull()
  })
})

describe('getFollowerCount', () => {
  it('returns { data: 3, error: null } when supabase count is 3', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ count: 3, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getFollowerCount('user-id')
    expect(result.data).toBe(3)
    expect(result.error).toBeNull()
  })
})

describe('getFollowers', () => {
  it('returns { data: [...profiles], error: null } for array of follower profiles', async () => {
    const profiles = [
      { username: 'alice', display_name: 'Alice', avatar_url: null },
      { username: 'bob', display_name: 'Bob', avatar_url: null },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ data: profiles, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getFollowers('user-id')
    expect(result.data).toHaveLength(2)
    expect(result.error).toBeNull()
  })
})

describe('getFollowing', () => {
  it('returns { data: [...profiles], error: null } for array of following profiles', async () => {
    const profiles = [
      { username: 'charlie', display_name: 'Charlie', avatar_url: null },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ data: profiles, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getFollowing('user-id')
    expect(result.data).toHaveLength(1)
    expect(result.error).toBeNull()
  })
})
