import { supabase } from '@/lib/supabase'
import type { Place } from '@/types/place'

export async function getPlaces(
  category?: string,
  city?: string
): Promise<{ data: Place[] | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('places')
    .select('id, name, slug, category, city, neighborhood, reviews(rating)')
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }
  if (city) {
    query = query.eq('city', city)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const places: Place[] = (data ?? []).map((p: {
    id: string
    name: string
    slug: string
    category: string
    city: string
    neighborhood: string | null
    reviews: { rating: number }[]
  }) => {
    const rs = p.reviews ?? []
    const avg_rating =
      rs.length > 0
        ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 2) / 2
        : null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      city: p.city,
      neighborhood: p.neighborhood,
      avg_rating,
      review_count: rs.length,
    }
  })

  return { data: places, error: null }
}

export async function searchPlaces(
  query: string
): Promise<{ data: Place[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, slug, category, city')
    .ilike('name', `%${query}%`)
    .limit(8)

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

export async function getPlaceBySlug(
  slug: string
): Promise<{ data: Place | null; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Place, error: null }
}

export async function createPlace(payload: {
  name: string
  slug: string
  category: string
  city: string
  neighborhood?: string
  description?: string
  created_by: string
}): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.from('places').insert(payload)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
