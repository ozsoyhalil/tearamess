import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/review'

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
