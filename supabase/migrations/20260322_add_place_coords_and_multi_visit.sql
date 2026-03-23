-- Phase 4: Add coordinate columns to places and allow multiple visit rows per user+place

-- 1. Add coordinate columns to places (nullable — existing rows have no coords)
alter table places
  add column if not exists latitude float,
  add column if not exists longitude float;

-- 2. Drop the unique constraint on visits to allow multiple check-ins per place.
--    recordVisit() will continue to work — it will now insert a new row each call
--    (same behaviour as checkIn). Both produce valid visit rows.
alter table visits drop constraint if exists visits_user_id_place_id_key;
