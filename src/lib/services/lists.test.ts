/**
 * @jest-environment node
 */
// LIST-01, LIST-02, LIST-03, LIST-04: Lists service — full assertions (GREEN phase)
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import {
  getUserLists,
  getOrCreateWishlist,
  createList,
  deleteList,
  addPlaceToList,
  removePlaceFromList,
  isPlaceInWishlist,
  addToWishlist,
  removeFromWishlist,
  updateListName,
  updateListPrivacy,
  getListById,
  getListItems,
} from './lists'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  jest.clearAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

const mockList = {
  id: 'list-1',
  user_id: 'user-1',
  name: 'My List',
  description: null,
  is_public: true,
  is_wishlist: false,
  created_at: '2026-01-01T00:00:00Z',
}

const mockWishlist = {
  id: 'wishlist-1',
  user_id: 'user-1',
  name: 'Gideceğim Yerler',
  description: null,
  is_public: true,
  is_wishlist: true,
  created_at: '2026-01-01T00:00:00Z',
}

describe('getUserLists', () => {
  it('returns only public lists for non-owners (includePrivate=false)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn2 = jest.fn() as jest.MockedFunction<any>
    orderFn2.mockResolvedValue({ data: [mockList], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn1 = jest.fn() as jest.MockedFunction<any>
    orderFn1.mockReturnValue({ order: orderFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqPublicFn = jest.fn() as jest.MockedFunction<any>
    eqPublicFn.mockReturnValue({ order: orderFn1 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqPublicFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqUserFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getUserLists('user-1', false)
    expect(result.data).toHaveLength(1)
    expect(result.error).toBeNull()
    expect(result.data![0].is_public).toBe(true)
  })

  it('returns all lists including private for owners (includePrivate=true)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn2 = jest.fn() as jest.MockedFunction<any>
    orderFn2.mockResolvedValue({ data: [mockList, { ...mockList, is_public: false }], error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn1 = jest.fn() as jest.MockedFunction<any>
    orderFn1.mockReturnValue({ order: orderFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ order: orderFn1 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqUserFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getUserLists('user-1', true)
    expect(result.data).toHaveLength(2)
    expect(result.error).toBeNull()
  })

  it('returns { data: null, error: string } on Supabase failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn2 = jest.fn() as jest.MockedFunction<any>
    orderFn2.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn1 = jest.fn() as jest.MockedFunction<any>
    orderFn1.mockReturnValue({ order: orderFn2 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqPublicFn = jest.fn() as jest.MockedFunction<any>
    eqPublicFn.mockReturnValue({ order: orderFn1 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqPublicFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqUserFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getUserLists('user-1', false)
    expect(result.data).toBeNull()
    expect(result.error).toBe('DB error')
  })
})

describe('getOrCreateWishlist', () => {
  it('returns existing wishlist row if found', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockWishlist, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqWishlistFn = jest.fn() as jest.MockedFunction<any>
    eqWishlistFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqWishlistFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqUserFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getOrCreateWishlist('user-1')
    expect(result.data).toEqual(mockWishlist)
    expect(result.error).toBeNull()
  })

  it('creates and returns wishlist row if not found (PGRST116 triggers create)', async () => {
    // First call: fetch returns PGRST116 (not found)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows returned' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqWishlistFn = jest.fn() as jest.MockedFunction<any>
    eqWishlistFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqWishlistFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFromFn = jest.fn() as jest.MockedFunction<any>
    selectFromFn.mockReturnValue({ eq: eqUserFn })

    // Second call: insert returns created wishlist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertSingleFn = jest.fn() as jest.MockedFunction<any>
    insertSingleFn.mockResolvedValue({ data: mockWishlist, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertSelectFn = jest.fn() as jest.MockedFunction<any>
    insertSelectFn.mockReturnValue({ single: insertSingleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockReturnValue({ select: insertSelectFn })

    mockFrom()
      .mockReturnValueOnce({ select: selectFromFn })
      .mockReturnValueOnce({ insert: insertFn })

    const result = await getOrCreateWishlist('user-1')
    expect(result.data).toEqual(mockWishlist)
    expect(result.error).toBeNull()
  })
})

describe('createList', () => {
  it('inserts list row and returns { data: List, error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockList, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockReturnValue({ select: selectFn })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await createList('user-1', 'My List')
    expect(result.data).toEqual(mockList)
    expect(result.error).toBeNull()
  })

  it('returns { data: null, error: string } on failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockReturnValue({ select: selectFn })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await createList('user-1', 'My List')
    expect(result.data).toBeNull()
    expect(result.error).toBe('insert failed')
  })
})

describe('deleteList', () => {
  it('removes list row and returns { error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteFn = jest.fn() as jest.MockedFunction<any>
    deleteFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ delete: deleteFn })

    const result = await deleteList('list-1')
    expect(result.error).toBeNull()
  })
})

describe('addPlaceToList', () => {
  it('inserts list_items row and returns { error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: null })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await addPlaceToList('list-1', 'place-1')
    expect(result.error).toBeNull()
  })

  it('treats duplicate insert (unique constraint error) as success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })
    mockFrom().mockReturnValue({ insert: insertFn })

    const result = await addPlaceToList('list-1', 'place-1')
    expect(result.error).toBeNull()
  })
})

describe('removePlaceFromList', () => {
  it('deletes list_items row and returns { error: null } on success', async () => {
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

    const result = await removePlaceFromList('list-1', 'place-1')
    expect(result.error).toBeNull()
  })
})

describe('isPlaceInWishlist', () => {
  it('returns { data: true, error: null } when place is in wishlist', async () => {
    // getOrCreateWishlist fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockWishlist, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqWishlistFn = jest.fn() as jest.MockedFunction<any>
    eqWishlistFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqWishlistFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectWishlistFn = jest.fn() as jest.MockedFunction<any>
    selectWishlistFn.mockReturnValue({ eq: eqUserFn })

    // isPlaceInWishlist check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqPlaceFn = jest.fn() as jest.MockedFunction<any>
    eqPlaceFn.mockResolvedValue({ count: 1, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqListFn = jest.fn() as jest.MockedFunction<any>
    eqListFn.mockReturnValue({ eq: eqPlaceFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectCountFn = jest.fn() as jest.MockedFunction<any>
    selectCountFn.mockReturnValue({ eq: eqListFn })

    mockFrom()
      .mockReturnValueOnce({ select: selectWishlistFn })
      .mockReturnValueOnce({ select: selectCountFn })

    const result = await isPlaceInWishlist('user-1', 'place-1')
    expect(result.data).toBe(true)
    expect(result.error).toBeNull()
  })

  it('returns { data: false, error: null } when place is not in wishlist', async () => {
    // getOrCreateWishlist fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockWishlist, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqWishlistFn = jest.fn() as jest.MockedFunction<any>
    eqWishlistFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqWishlistFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectWishlistFn = jest.fn() as jest.MockedFunction<any>
    selectWishlistFn.mockReturnValue({ eq: eqUserFn })

    // count = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqPlaceFn = jest.fn() as jest.MockedFunction<any>
    eqPlaceFn.mockResolvedValue({ count: 0, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqListFn = jest.fn() as jest.MockedFunction<any>
    eqListFn.mockReturnValue({ eq: eqPlaceFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectCountFn = jest.fn() as jest.MockedFunction<any>
    selectCountFn.mockReturnValue({ eq: eqListFn })

    mockFrom()
      .mockReturnValueOnce({ select: selectWishlistFn })
      .mockReturnValueOnce({ select: selectCountFn })

    const result = await isPlaceInWishlist('user-1', 'place-1')
    expect(result.data).toBe(false)
    expect(result.error).toBeNull()
  })
})

describe('addToWishlist', () => {
  it('gets wishlist then adds place, returns { error: null }', async () => {
    // getOrCreateWishlist fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockWishlist, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqWishlistFn = jest.fn() as jest.MockedFunction<any>
    eqWishlistFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqWishlistFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectWishlistFn = jest.fn() as jest.MockedFunction<any>
    selectWishlistFn.mockReturnValue({ eq: eqUserFn })

    // addPlaceToList insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFn = jest.fn() as jest.MockedFunction<any>
    insertFn.mockResolvedValue({ error: null })

    mockFrom()
      .mockReturnValueOnce({ select: selectWishlistFn })
      .mockReturnValueOnce({ insert: insertFn })

    const result = await addToWishlist('user-1', 'place-1')
    expect(result.error).toBeNull()
  })
})

describe('removeFromWishlist', () => {
  it('gets wishlist then removes place, returns { error: null }', async () => {
    // getOrCreateWishlist fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockWishlist, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqWishlistFn = jest.fn() as jest.MockedFunction<any>
    eqWishlistFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqUserFn = jest.fn() as jest.MockedFunction<any>
    eqUserFn.mockReturnValue({ eq: eqWishlistFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectWishlistFn = jest.fn() as jest.MockedFunction<any>
    selectWishlistFn.mockReturnValue({ eq: eqUserFn })

    // removePlaceFromList delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqPlaceFn = jest.fn() as jest.MockedFunction<any>
    eqPlaceFn.mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqListFn = jest.fn() as jest.MockedFunction<any>
    eqListFn.mockReturnValue({ eq: eqPlaceFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteFn = jest.fn() as jest.MockedFunction<any>
    deleteFn.mockReturnValue({ eq: eqListFn })

    mockFrom()
      .mockReturnValueOnce({ select: selectWishlistFn })
      .mockReturnValueOnce({ delete: deleteFn })

    const result = await removeFromWishlist('user-1', 'place-1')
    expect(result.error).toBeNull()
  })
})

describe('updateListName', () => {
  it('updates name column and returns { error: null } on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFn = jest.fn() as jest.MockedFunction<any>
    updateFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ update: updateFn })

    const result = await updateListName('list-1', 'New Name')
    expect(result.error).toBeNull()
  })
})

describe('updateListPrivacy', () => {
  it('toggles is_public to false (private) and returns { error: null }', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFn = jest.fn() as jest.MockedFunction<any>
    updateFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ update: updateFn })

    const result = await updateListPrivacy('list-1', false)
    expect(result.error).toBeNull()
  })

  it('toggles is_public to true (public) and returns { error: null }', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFn = jest.fn() as jest.MockedFunction<any>
    updateFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ update: updateFn })

    const result = await updateListPrivacy('list-1', true)
    expect(result.error).toBeNull()
  })
})

describe('getListById', () => {
  it('returns { data: List, error: null } when list is found', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: mockList, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getListById('list-1')
    expect(result.data).toEqual(mockList)
    expect(result.error).toBeNull()
  })

  it('returns { data: null, error: null } when list is not found (PGRST116)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const singleFn = jest.fn() as jest.MockedFunction<any>
    singleFn.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows returned' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ single: singleFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getListById('non-existent')
    expect(result.data).toBeNull()
    expect(result.error).toBeNull()
  })
})

describe('getListItems', () => {
  it('returns { data: ListWithPlaces[], error: null } with place name/category/neighborhood details', async () => {
    const mockItems = [
      {
        list_id: 'list-1',
        place_id: 'place-1',
        created_at: '2026-01-01T00:00:00Z',
        places: { id: 'place-1', name: 'Cafe', category: 'cafe', neighborhood: 'Kızılay' },
      },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderFn = jest.fn() as jest.MockedFunction<any>
    orderFn.mockResolvedValue({ data: mockItems, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eqFn = jest.fn() as jest.MockedFunction<any>
    eqFn.mockReturnValue({ order: orderFn })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFn = jest.fn() as jest.MockedFunction<any>
    selectFn.mockReturnValue({ eq: eqFn })
    mockFrom().mockReturnValue({ select: selectFn })

    const result = await getListItems('list-1')
    expect(result.data).toHaveLength(1)
    expect(result.data![0].places?.name).toBe('Cafe')
    expect(result.error).toBeNull()
  })
})
