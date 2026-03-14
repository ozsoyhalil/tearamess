export type VisitActivity = {
  type: 'visit'
  id: string
  created_at: string
  user_id: string
  author: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
  place: {
    id: string
    name: string
    slug: string
    category: string
  }
}

export type ReviewActivity = {
  type: 'review'
  id: string
  created_at: string
  user_id: string
  author: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
  place: {
    id: string
    name: string
    slug: string
    category: string
  }
  rating: number
  content: string | null
}

export type FeedItem = VisitActivity | ReviewActivity
