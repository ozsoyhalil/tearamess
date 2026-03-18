-- lists table
create table lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default true,
  is_wishlist boolean not null default false,
  created_at timestamptz not null default now()
);

-- list_items junction table (composite PK enforces uniqueness)
create table list_items (
  list_id uuid not null references lists(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, place_id)
);

-- RLS: lists
alter table lists enable row level security;

-- Anyone can read public lists
create policy "public lists readable by all"
  on lists for select
  using (is_public = true);

-- Owners can read their own lists (including private)
create policy "owners read own lists"
  on lists for select
  using (auth.uid() = user_id);

-- Only owner can insert/update/delete
create policy "owners manage own lists"
  on lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: list_items
alter table list_items enable row level security;

-- list_items readable when parent list is readable
create policy "list_items readable via list"
  on list_items for select
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and (lists.is_public = true or lists.user_id = auth.uid())
    )
  );

-- Only list owner can insert/delete items
create policy "list owner manages items"
  on list_items for all
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  );
