export interface Place {
  id: string
  name: string
  slug: string
  category: string
  city: string
  neighborhood?: string | null
  description?: string | null
  created_by?: string
  created_at?: string
  avg_rating?: number | null
  review_count?: number | null
  cover_image_url?: string | null
}
