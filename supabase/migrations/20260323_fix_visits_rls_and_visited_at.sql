-- Phase 4 fix: ensure visits.visited_at exists and RLS allows authenticated inserts

-- 1. Add visited_at column if it doesn't exist yet
--    (Some environments were created with only created_at)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'visits' and column_name = 'visited_at'
  ) then
    alter table visits add column visited_at timestamptz not null default now();
    -- Backfill from created_at for any existing rows
    update visits set visited_at = created_at where visited_at is null;
  end if;
end
$$;

-- 2. Ensure RLS is enabled on visits
alter table visits enable row level security;

-- 3. Allow authenticated users to insert their own visit rows
--    (DROP first to make migration re-runnable)
drop policy if exists "authenticated users can insert own visits" on visits;
create policy "authenticated users can insert own visits"
  on visits for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 4. Allow users to read their own visits
drop policy if exists "users can read own visits" on visits;
create policy "users can read own visits"
  on visits for select
  to authenticated
  using (auth.uid() = user_id);

-- 5. Allow reading visits for feed (followed users) — public reads needed by feed service
drop policy if exists "visits readable for feed" on visits;
create policy "visits readable for feed"
  on visits for select
  to authenticated
  using (true);
