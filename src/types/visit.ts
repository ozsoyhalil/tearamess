export interface Visit {
  id: string
  user_id: string
  place_id: string
  visited_at: string
  created_at: string
  // Joined place data (present when fetched with select('*, places(...)'))
  places?: {
    id: string
    name: string
    slug: string
    category: string
    city?: string
  } | null
}
