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

export async function getProfileByUsername(
  username: string
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, avatar_url')
    .eq('username', username)
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Kullanıcı bulunamadı' }
  return { data: data as Profile, error: null }
}
