import { supabase } from '@/lib/supabase'

export async function checkIn(
  userId: string,
  placeId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('visits')
    .insert({ user_id: userId, place_id: placeId, visited_at: new Date().toISOString() })

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
