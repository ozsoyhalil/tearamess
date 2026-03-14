import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/profile'

export async function getProfileByUserId(
  userId: string
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Profile, error: null }
}

export async function getProfile(
  userId: string
): Promise<{ data: Profile | null; error: string | null }> {
  return getProfileByUserId(userId)
}
