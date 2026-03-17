import { supabase } from '@/lib/supabase'
import type { FeedItem } from '@/types/feed'

const PAGE_SIZE = 20

const DELETED_PLACE = { id: '', name: 'Silinmiş mekan', slug: '', category: '' }

export async function getFeed(
  userId: string,
  cursor?: string
): Promise<{ data: FeedItem[] | null; error: string | null }> {
  // Step 1: fetch the IDs of users this person follows
  const { data: followData, error: followError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (followError) return { data: null, error: followError.message }
  if (!followData || followData.length === 0) return { data: [], error: null }

  const followedIds = (followData as Array<{ following_id: string }>).map(
    (r) => r.following_id
  )

  // Step 2: fetch reviews and visits for followed users in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reviewsQuery: any = supabase
    .from('reviews')
    .select(
      'id, user_id, place_id, rating, content, created_at, profiles(username, display_name, avatar_url), places(id, name, slug, category)'
    )
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let visitsQuery: any = supabase
    .from('visits')
    .select(
      'id, user_id, place_id, created_at, profiles(username, display_name, avatar_url), places(id, name, slug, category)'
    )
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })

  if (cursor) {
    reviewsQuery = reviewsQuery.lt('created_at', cursor)
    visitsQuery = visitsQuery.lt('created_at', cursor)
  }

  const [reviewsResult, visitsResult] = await Promise.all([reviewsQuery, visitsQuery])

  type ReviewRow = {
    id: string
    user_id: string
    place_id: string
    rating: number
    content: string | null
    created_at: string
    profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
    places: { id: string; name: string; slug: string; category: string } | null
  }

  type VisitRow = {
    id: string
    user_id: string
    place_id: string
    created_at: string
    profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
    places: { id: string; name: string; slug: string; category: string } | null
  }

  const reviews = (reviewsResult.data ?? []) as ReviewRow[]
  const visits = (visitsResult.data ?? []) as VisitRow[]

  const reviewItems: FeedItem[] = reviews.map((r) => ({
    type: 'review' as const,
    id: r.id,
    created_at: r.created_at,
    user_id: r.user_id,
    author: r.profiles ?? { username: null, display_name: null, avatar_url: null },
    place: r.places ?? DELETED_PLACE,
    rating: r.rating,
    content: r.content,
  }))

  const visitItems: FeedItem[] = visits.map((v) => ({
    type: 'visit' as const,
    id: v.id,
    created_at: v.created_at,
    user_id: v.user_id,
    author: v.profiles ?? { username: null, display_name: null, avatar_url: null },
    place: v.places ?? DELETED_PLACE,
  }))

  const merged = [...reviewItems, ...visitItems]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, PAGE_SIZE)

  return { data: merged, error: null }
}
