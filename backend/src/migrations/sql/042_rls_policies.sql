/* Tenant row-level security. Only applied to tables confirmed (by
     directly reading each one's own CREATE TABLE block, not assumed) to
     have a real tenant_id column. Deliberately NOT applied to
     booking_locks, campaign_templates, campaign_recipients, renters,
     user_notifications, favorites, none of them have a direct tenant_id
     column, they're tenant-scoped only transitively through a parent
     record. Protecting those correctly needs either denormalizing
     tenant_id onto them directly or JOIN-based policies, real follow-up
     work, not silently skipped, explicitly not done here.

     Every policy requires app.current_tenant_id to be set for the
     session (via beginTenantScopedTransaction in rlsMiddleware.ts /
     requireTenantMember), current_setting(..., true) returns NULL
     rather than erroring if unset, which means any query running
     without that context (a bug, a missed middleware, a future code
     path) sees zero rows rather than crashing, fails closed, not open.

     roles and campaigns both allow tenant_id IS NULL through
     unconditionally: system roles (is_system = true, tenant_id NULL)
     must stay visible to every tenant, they're not any one tenant's
     data. Same reasoning for campaigns with a NULL tenant_id, if that's
     genuinely a platform-wide campaign concept and not a data-quality
     gap, worth confirming which it actually is before relying on this. */

ALTER TABLE properties            ENABLE ROW LEVEL SECURITY;
   ALTER TABLE properties            FORCE  ROW LEVEL SECURITY;
   ALTER TABLE room_types            ENABLE ROW LEVEL SECURITY;
   ALTER TABLE room_types            FORCE  ROW LEVEL SECURITY;
   ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings              FORCE  ROW LEVEL SECURITY;
   ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments              FORCE  ROW LEVEL SECURITY;
   ALTER TABLE escrow_ledger         ENABLE ROW LEVEL SECURITY;
   ALTER TABLE escrow_ledger         FORCE  ROW LEVEL SECURITY;
   ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
   ALTER TABLE invoices              FORCE  ROW LEVEL SECURITY;
   ALTER TABLE invitations           ENABLE ROW LEVEL SECURITY;
   ALTER TABLE invitations           FORCE  ROW LEVEL SECURITY;
   ALTER TABLE seller_notifications  ENABLE ROW LEVEL SECURITY;
   ALTER TABLE seller_notifications  FORCE  ROW LEVEL SECURITY;
   ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reviews               FORCE  ROW LEVEL SECURITY;
   ALTER TABLE availability_calendar ENABLE ROW LEVEL SECURITY;
   ALTER TABLE availability_calendar FORCE  ROW LEVEL SECURITY;
   ALTER TABLE user_roles            ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_roles            FORCE  ROW LEVEL SECURITY;
   ALTER TABLE roles                 ENABLE ROW LEVEL SECURITY;
   ALTER TABLE roles                 FORCE  ROW LEVEL SECURITY;
   ALTER TABLE campaigns             ENABLE ROW LEVEL SECURITY;
   ALTER TABLE campaigns             FORCE  ROW LEVEL SECURITY;

   DROP POLICY IF EXISTS tenant_isolation ON properties;
   CREATE POLICY tenant_isolation ON properties
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON room_types;
   CREATE POLICY tenant_isolation ON room_types
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON bookings;
   CREATE POLICY tenant_isolation ON bookings
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON payments;
   CREATE POLICY tenant_isolation ON payments
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON escrow_ledger;
   CREATE POLICY tenant_isolation ON escrow_ledger
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON invoices;
   CREATE POLICY tenant_isolation ON invoices
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON invitations;
   CREATE POLICY tenant_isolation ON invitations
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON seller_notifications;
   CREATE POLICY tenant_isolation ON seller_notifications
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON reviews;
   CREATE POLICY tenant_isolation ON reviews
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON availability_calendar;
   CREATE POLICY tenant_isolation ON availability_calendar
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON user_roles;
   CREATE POLICY tenant_isolation ON user_roles
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON roles;
   CREATE POLICY tenant_isolation ON roles
     USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::uuid);

   DROP POLICY IF EXISTS tenant_isolation ON campaigns;
   CREATE POLICY tenant_isolation ON campaigns
     USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::uuid);
