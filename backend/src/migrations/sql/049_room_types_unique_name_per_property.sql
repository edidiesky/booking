/* 049 room_types unique name per property */
/* Required for createRoomTypesBulk to become an idempotent upsert
   (ON CONFLICT DO UPDATE)
*/

CREATE UNIQUE INDEX IF NOT EXISTS uq_room_types_property_name
  ON room_types (property_id, name);