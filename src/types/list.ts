export interface List {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  is_wishlist: boolean
  created_at: string
  item_count?: number  // optional: populated via list_items(count) nested select
}

export interface ListItem {
  list_id: string
  place_id: string
  created_at: string
}
