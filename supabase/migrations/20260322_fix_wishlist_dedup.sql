-- Delete duplicate wishlist rows; keep only the oldest one per user
DELETE FROM lists
WHERE is_wishlist = true
  AND id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM lists
    WHERE is_wishlist = true
    ORDER BY user_id, created_at ASC
  );
