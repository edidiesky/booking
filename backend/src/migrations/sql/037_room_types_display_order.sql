/* Room type display order: only meaningful for the "custom" sort mode,
     every other mode (alphabetical/price/newest/oldest/rating) sorts by
     an existing real column, doesn't need this. NULL by default, custom
     order only applies to room types a host has explicitly reordered. */

ALTER TABLE room_types ADD COLUMN IF NOT EXISTS display_order INTEGER;
   ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_sort_mode VARCHAR(20) NOT NULL DEFAULT 'price'
     CHECK (room_sort_mode IN ('alphabetical', 'price', 'rating', 'newest', 'oldest', 'custom'));
