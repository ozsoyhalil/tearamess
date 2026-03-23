-- Add bio and city columns to profiles table (used by profile edit form)
alter table profiles
  add column if not exists bio text,
  add column if not exists city text;
