-- /*
--   Invariant: a property can only be 'active' (publicly listed on the main
--   website and the seller storefront) when it has at least one active room type.

--   Every public read path already filters on properties.status = 'active'
--   (public list, search, storefront, favorites, discovery, popular MV, audience
--   resolver). Enforcing the invariant here makes all of them correct without
--   touching each query.

--   1. trg_property_publishable: rejects INSERT or UPDATE that sets status to
--      'active' when no active room type exists.
--   2. trg_room_types_demote_property: when a room type stops being active
--      (status change, move to another property, or delete), the property is
--      moved back to 'draft' if it no longer has an active room type.

--   Concurrency: both functions lock the property row first. Without that, two
--   transactions deactivating the last two rooms concurrently each see the
--   other's room as still active (write skew under READ COMMITTED) and the
--   property stays active with zero rooms.
-- */

-- CREATE OR REPLACE FUNCTION enforce_property_publishable()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   IF NEW.status = 'active'
--      AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
--     IF NOT EXISTS (
--       SELECT 1 FROM room_types rt
--       WHERE rt.property_id = NEW.id AND rt.status = 'active'
--     ) THEN
--       RAISE EXCEPTION 'Property % cannot be active without an active room type', NEW.id
--         USING ERRCODE = 'check_violation',
--               CONSTRAINT = 'property_requires_active_room_type';
--     END IF;
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- DROP TRIGGER IF EXISTS trg_property_publishable ON properties;
-- CREATE TRIGGER trg_property_publishable
--   BEFORE INSERT OR UPDATE OF status ON properties
--   FOR EACH ROW EXECUTE FUNCTION enforce_property_publishable();

-- CREATE OR REPLACE FUNCTION demote_property_without_active_rooms()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $$
-- DECLARE
--   affected uuid := OLD.property_id;
-- BEGIN
--   -- Still active on the same property: nothing to check.
--   IF TG_OP = 'UPDATE'
--      AND NEW.status = 'active'
--      AND NEW.property_id = OLD.property_id THEN
--     RETURN NULL;
--   END IF;

--   -- Serialize against other room changes and against publishing.
--   PERFORM 1 FROM properties WHERE id = affected FOR UPDATE;

--   UPDATE properties p
--      SET status = 'draft', updated_at = now()
--    WHERE p.id = affected
--      AND p.status = 'active'
--      AND NOT EXISTS (
--        SELECT 1 FROM room_types rt
--        WHERE rt.property_id = affected AND rt.status = 'active'
--      );
--   RETURN NULL;
-- END;
-- $$;

-- DROP TRIGGER IF EXISTS trg_room_types_demote_property ON room_types;
-- CREATE TRIGGER trg_room_types_demote_property
--   AFTER UPDATE OF status, property_id OR DELETE ON room_types
--   FOR EACH ROW EXECUTE FUNCTION demote_property_without_active_rooms();

-- /*
--   Backfill: properties that are live today with no active room type.
--   createProperty hardcoded status 'active', so every property created
--   without rooms is currently public.

--   RLS: properties has FORCE ROW LEVEL SECURITY. This UPDATE only sees rows
--   when the migration role is a superuser or has BYPASSRLS, the same
--   requirement as 042_rls_policies.sql. The NOTICE reports the count so a
--   silent zero is visible in the migration log.
-- */
-- DO $$
-- DECLARE
--   demoted integer;
-- BEGIN
--   UPDATE properties p
--      SET status = 'draft', updated_at = now()
--    WHERE p.status = 'active'
--      AND NOT EXISTS (
--        SELECT 1 FROM room_types rt
--        WHERE rt.property_id = p.id AND rt.status = 'active'
--      );
--   GET DIAGNOSTICS demoted = ROW_COUNT;
--   RAISE NOTICE '060: demoted % active properties without an active room type to draft', demoted;
-- END;
-- $$;