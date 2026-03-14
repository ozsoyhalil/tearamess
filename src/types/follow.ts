export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

// Minimal profile shape returned when fetching follower/following lists
export interface FollowProfile {
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}
