import { supabase } from '@/lib/supabase'
import type { FollowProfile } from '@/types/follow'

export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<{ data: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, following_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) return { data: false, error: error.message }
  return { data: data !== null, error: null }
}

export async function getFollowerCount(
  userId: string
): Promise<{ data: number; error: string | null }> {
  const { count, error } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', userId)

  if (error) return { data: 0, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function getFollowingCount(
  userId: string
): Promise<{ data: number; error: string | null }> {
  const { count, error } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', userId)

  if (error) return { data: 0, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function getFollowers(
  userId: string
): Promise<{ data: FollowProfile[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('follows')
    .select('user_id:follower_id, username:profiles(username), display_name:profiles(display_name), avatar_url:profiles(avatar_url)')
    .eq('following_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as unknown as FollowProfile[], error: null }
}

export async function getFollowing(
  userId: string
): Promise<{ data: FollowProfile[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('follows')
    .select('user_id:following_id, username:profiles(username), display_name:profiles(display_name), avatar_url:profiles(avatar_url)')
    .eq('follower_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as unknown as FollowProfile[], error: null }
}
