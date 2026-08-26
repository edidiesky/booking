/* Tenant row-level security.*/

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
