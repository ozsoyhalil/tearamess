/**
 * @jest-environment node
 */
// LIST-01, LIST-02, LIST-03, LIST-04: Lists service stubs (RED — lists.ts does not exist yet)
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

describe('getUserLists', () => {
  it('returns only public lists for non-owners (includePrivate=false)', async () => {
    /* stub */
    expect(true).toBe(true)
  })

  it('returns all lists including private for owners (includePrivate=true)', async () => {
    /* stub */
    expect(true).toBe(true)
  })

  it('returns { data: null, error: string } on Supabase failure', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('getOrCreateWishlist', () => {
  it('returns existing wishlist row if found', async () => {
    /* stub */
    expect(true).toBe(true)
  })

  it('creates and returns wishlist row if not found (PGRST116 triggers create)', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('createList', () => {
  it('inserts list row and returns { data: List, error: null } on success', async () => {
    /* stub */
    expect(true).toBe(true)
  })

  it('returns { data: null, error: string } on failure', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('deleteList', () => {
  it('removes list row and returns { error: null } on success', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('addPlaceToList', () => {
  it('inserts list_items row and returns { error: null } on success', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('removePlaceFromList', () => {
  it('deletes list_items row and returns { error: null } on success', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('isPlaceInWishlist', () => {
  it('returns { data: boolean, error: null }', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('updateListName', () => {
  it('updates name column and returns { error: null } on success', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('updateListPrivacy', () => {
  it('toggles is_public to false (private) and returns { error: null }', async () => {
    /* stub */
    expect(true).toBe(true)
  })

  it('toggles is_public to true (public) and returns { error: null }', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('getListById', () => {
  it('returns { data: List, error: null } when list is found', async () => {
    /* stub */
    expect(true).toBe(true)
  })

  it('returns { data: null, error: null } when list is not found', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})

describe('getListItems', () => {
  it('returns { data: ListWithPlaces[], error: null } with place name/category/neighborhood details', async () => {
    /* stub */
    expect(true).toBe(true)
  })
})
