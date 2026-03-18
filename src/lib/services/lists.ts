import { supabase } from '@/lib/supabase'
import type { List, ListItem } from '@/types/list'
import type { Place } from '@/types/place'

export type ListWithPlaces = ListItem & {
  places: Pick<Place, 'id' | 'name' | 'category' | 'neighborhood'> | null
}

export async function getUserLists(
  userId: string,
  includePrivate = false
): Promise<{ data: List[] | null; error: string | null }> {
  let query = supabase
    .from('lists')
    .select('id, name, description, is_public, is_wishlist, created_at, list_items(count)')
    .eq('user_id', userId)

  if (!includePrivate) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query
    .order('is_wishlist', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  // Deduplicate: keep at most one wishlist row (the first one returned, which is
  // ordered by is_wishlist DESC so the real one comes first)
  const rows = (data ?? []) as unknown as List[]
  let wishlistSeen = false
  const deduped = rows.filter((list) => {
    if (list.is_wishlist) {
      if (wishlistSeen) return false
      wishlistSeen = true
    }
    return true
  })

  return { data: deduped, error: null }
}

export async function getOrCreateWishlist(
  userId: string
): Promise<{ data: List | null; error: string | null }> {
  const { data: existing, error: fetchError } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', userId)
    .eq('is_wishlist', true)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { data: null, error: fetchError.message }
  }

  if (existing) return { data: existing as List, error: null }

  const { data: created, error: insertError } = await supabase
    .from('lists')
    .insert({
      user_id: userId,
      name: 'Gideceğim Yerler',
      is_public: true,
      is_wishlist: true,
    })
    .select()
    .single()

  if (insertError) return { data: null, error: insertError.message }
  return { data: created as List, error: null }
}

export async function createList(
  userId: string,
  name: string,
  description?: string
): Promise<{ data: List | null; error: string | null }> {
  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: userId,
      name,
      description: description ?? null,
      is_public: true,
      is_wishlist: false,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as List, error: null }
}

export async function deleteList(
  listId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function addPlaceToList(
  listId: string,
  placeId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, place_id: placeId })

  // Unique constraint violation (composite PK duplicate) — treat as success
  if (error && error.code !== '23505') return { error: error.message }
  return { error: null }
}

export async function removePlaceFromList(
  listId: string,
  placeId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('place_id', placeId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function addToWishlist(
  userId: string,
  placeId: string
): Promise<{ error: string | null }> {
  const { data: wishlist, error: wishlistError } = await getOrCreateWishlist(userId)
  if (wishlistError || !wishlist) return { error: wishlistError ?? 'Could not get wishlist' }
  return addPlaceToList(wishlist.id, placeId)
}

export async function removeFromWishlist(
  userId: string,
  placeId: string
): Promise<{ error: string | null }> {
  const { data: wishlist, error: wishlistError } = await getOrCreateWishlist(userId)
  if (wishlistError || !wishlist) return { error: wishlistError ?? 'Could not get wishlist' }
  return removePlaceFromList(wishlist.id, placeId)
}

export async function isPlaceInWishlist(
  userId: string,
  placeId: string
): Promise<{ data: boolean; error: string | null }> {
  const { data: wishlist, error: wishlistError } = await getOrCreateWishlist(userId)
  if (wishlistError || !wishlist) return { data: false, error: wishlistError ?? 'Could not get wishlist' }

  const { count, error } = await supabase
    .from('list_items')
    .select('list_id', { count: 'exact', head: true })
    .eq('list_id', wishlist.id)
    .eq('place_id', placeId)

  if (error) return { data: false, error: error.message }
  return { data: (count ?? 0) > 0, error: null }
}

export async function updateListName(
  listId: string,
  name: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('lists')
    .update({ name })
    .eq('id', listId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateListPrivacy(
  listId: string,
  isPublic: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('lists')
    .update({ is_public: isPublic })
    .eq('id', listId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function getListById(
  listId: string
): Promise<{ data: List | null; error: string | null }> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)
    .single()

  if (error && error.code === 'PGRST116') return { data: null, error: null }
  if (error) return { data: null, error: error.message }
  return { data: data as List, error: null }
}

export async function getListItems(
  listId: string
): Promise<{ data: ListWithPlaces[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('list_items')
    .select('list_id, place_id, created_at, places(id, name, category, neighborhood)')
    .eq('list_id', listId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as unknown as ListWithPlaces[], error: null }
}

/**
 * Returns the list IDs that contain the given place for a specific user.
 * Used by ListItemSelector to pre-check which lists already include a place.
 * NOTE: Stub added in Plan 04 to satisfy TypeScript import; full implementation
 * in Plan 05 Task 2 will replace this with a real query.
 */
export async function getPlaceListMembership(
  userId: string,
  placeId: string
): Promise<{ data: string[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('list_items')
    .select('list_id, lists!inner(user_id)')
    .eq('place_id', placeId)
    .eq('lists.user_id', userId)

  if (error) return { data: null, error: error.message }
  const ids = (data ?? []).map((row: { list_id: string }) => row.list_id)
  return { data: ids, error: null }
}
