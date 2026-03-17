import { supabase } from '@/lib/supabase'
import type { Visit } from '@/types/visit'

export async function getUserVisits(
  userId: string
): Promise<{ data: Visit[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('visits')
    .select('*, places(id, name, slug, category, city)')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as Visit[], error: null }
}

export async function recordVisit(
  userId: string,
  placeId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('visits')
    .upsert(
      { user_id: userId, place_id: placeId, visited_at: new Date().toISOString() },
      { onConflict: 'user_id,place_id' }
    )

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
