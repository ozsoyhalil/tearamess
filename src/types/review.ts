export interface Review {
  id: string
  place_id: string
  user_id: string
  rating: number         // 0–5 scale, supports 0.5 increments
  content: string | null // DB column is 'content', NOT 'comment'
  visit_date: string | null
  created_at: string
  profiles?: {
    username: string | null
    display_name?: string | null
    avatar_url?: string | null
  } | null
}
