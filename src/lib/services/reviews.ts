import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/review'
import { recordVisit } from './visits'

export async function getReviewsForPlace(
  placeId: string
): Promise<{ data: Review[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(username, display_name)')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as Review[], error: null }
}

export async function createReview(payload: {
  place_id: string
  user_id: string
  rating: number
  content: string | null
  visit_date: string | null
}): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.from('reviews').insert(payload)
  if (error) return { data: null, error: error.message }

  // Auto-record a visit when a review is created — silent failure is acceptable
  recordVisit(payload.user_id, payload.place_id).catch(() => {})

  return { data: null, error: null }
}

export async function getUserReviews(
  userId: string
): Promise<{ data: unknown[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, places(name, slug, category, city)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

export async function getViewerRatingsForPlaces(
  userId: string,
  placeIds: string[]
): Promise<{ data: Record<string, number> | null; error: string | null }> {
  if (placeIds.length === 0) return { data: {}, error: null }
  const { data, error } = await supabase
    .from('reviews')
    .select('place_id, rating')
    .eq('user_id', userId)
    .in('place_id', placeIds)
  if (error) return { data: null, error: error.message }
  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.place_id] = row.rating
  }
  return { data: map, error: null }
}
