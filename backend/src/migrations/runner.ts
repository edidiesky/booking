import logger from "../utils/logger";
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations: string[] = [
  /* 001 enums */
  `DO $$ BEGIN
    CREATE TYPE tenant_status      AS ENUM ('draft','active','suspended');
    CREATE TYPE user_type_enum     AS ENUM ('guest','host:admin','host:staff','host:inspector','platform:admin');
    CREATE TYPE user_status_enum   AS ENUM ('draft','active','inactive','suspended');
    CREATE TYPE property_type_enum AS ENUM ('shortlet','hotel','guesthouse');
    CREATE TYPE property_status    AS ENUM ('draft','active','paused','archived');
    CREATE TYPE room_status        AS ENUM ('active','inactive');
    CREATE TYPE booking_status     AS ENUM ('pending_payment','confirmed','checked_in','checked_out','cancelled','refunded');
    CREATE TYPE payment_status     AS ENUM ('pending','success','failed','refunded');
    CREATE TYPE payment_gateway    AS ENUM ('paystack','flutterwave');
    CREATE TYPE escrow_status      AS ENUM ('held','released','refunded','partially_refunded');
    CREATE TYPE outbox_status      AS ENUM ('pending','processed','dead');
    CREATE TYPE webhook_log_status AS ENUM ('pending','failed','permanent_failure','completed');
    CREATE TYPE audit_action       AS ENUM ('created','updated','deleted','status_changed','payment','login','logout');
    CREATE TYPE ledger_entry_type  AS ENUM ('CREDIT','FEE','REFUND','PAYOUT');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

  /* 002 tenants */
  `CREATE TABLE IF NOT EXISTS tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(100)  NOT NULL UNIQUE,
    name                VARCHAR(255)  NOT NULL,
    owner_user_id       UUID          NOT NULL,
    platform_fee_pct    NUMERIC(5,2)  NOT NULL DEFAULT 10.00,
    cancellation_policy JSONB         NOT NULL DEFAULT '[]',
    status              tenant_status NOT NULL DEFAULT 'draft',
    settings            JSONB         NOT NULL DEFAULT '{"timezone":"Africa/Lagos","currency":"NGN","locale":"en-NG"}',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
  CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);`,

  /* 003 users */
  `CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255)     NOT NULL UNIQUE,
    phone             VARCHAR(30),
    password_hash     VARCHAR(255)     NOT NULL,
    first_name        VARCHAR(100),
    last_name         VARCHAR(100),
    profile_image     VARCHAR(500),
    user_type         user_type_enum   NOT NULL,
    tenant_id         UUID             REFERENCES tenants(id) ON DELETE SET NULL,
    status            user_status_enum NOT NULL DEFAULT 'draft',
    is_email_verified BOOLEAN          NOT NULL DEFAULT false,
    last_active_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ      NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id, status);`,

  /* 004 onboarding_sessions (replaces fire-and-forget email verify - stored in Redis but this tracks state) */
  `CREATE TABLE IF NOT EXISTS profiles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name      VARCHAR(255),
    bio               TEXT,
    avatar_url        VARCHAR(500),
    address           JSONB NOT NULL DEFAULT '{}',
    preferences       JSONB NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);`,

  /* 005 refresh_tokens */
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_user   ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_expiry ON refresh_tokens(expires_at);`,

  /* 006 properties */
  `CREATE TABLE IF NOT EXISTS properties (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name           VARCHAR(255)       NOT NULL,
    description    TEXT,
    property_type  property_type_enum NOT NULL,
    address        JSONB              NOT NULL DEFAULT '{}',
    amenities      TEXT[]             NOT NULL DEFAULT '{}',
    images         TEXT[]             NOT NULL DEFAULT '{}',
    check_in_time  TIME               NOT NULL DEFAULT '14:00',
    check_out_time TIME               NOT NULL DEFAULT '11:00',
    status         property_status    NOT NULL DEFAULT 'draft',
    created_at     TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ        NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id, status);`,

  /* 007 room_types */
  `CREATE TABLE IF NOT EXISTS room_types (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id    UUID         NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id      UUID         NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    max_occupancy  INT          NOT NULL DEFAULT 2,
    base_price_ngn NUMERIC(12,2) NOT NULL,
    images         TEXT[]       NOT NULL DEFAULT '{}',
    amenities      TEXT[]       NOT NULL DEFAULT '{}',
    quantity       INT          NOT NULL DEFAULT 1,
    status         room_status  NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_room_types_property ON room_types(property_id, status);
  CREATE INDEX IF NOT EXISTS idx_room_types_tenant   ON room_types(tenant_id);`,

  /* 008 availability_calendar */
  `CREATE TABLE IF NOT EXISTS availability_calendar (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id       UUID          NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    tenant_id          UUID          NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
    date               DATE          NOT NULL,
    available_count    INT           NOT NULL,
    price_override_ngn NUMERIC(12,2),
    is_blocked         BOOLEAN       NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_availability UNIQUE(room_type_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_avail_room_date ON availability_calendar(room_type_id, date);`,

  /* 009 booking_locks */
  `CREATE TABLE IF NOT EXISTS booking_locks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID        NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    check_in     DATE        NOT NULL,
    check_out    DATE        NOT NULL,
    rooms_held   INT         NOT NULL DEFAULT 1,
    session_id   VARCHAR(64) NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_locks_room_dates ON booking_locks(room_type_id, check_in, check_out);
  CREATE INDEX IF NOT EXISTS idx_locks_expires    ON booking_locks(expires_at);
  CREATE INDEX IF NOT EXISTS idx_locks_session    ON booking_locks(session_id);`,

  /* 010 bookings */
  `CREATE TABLE IF NOT EXISTS bookings (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref        VARCHAR(20)    NOT NULL UNIQUE,
    tenant_id          UUID           NOT NULL REFERENCES tenants(id),
    property_id        UUID           NOT NULL REFERENCES properties(id),
    room_type_id       UUID           NOT NULL REFERENCES room_types(id),
    guest_user_id      UUID           NOT NULL REFERENCES users(id),
    rooms_count        INT            NOT NULL DEFAULT 1,
    check_in           DATE           NOT NULL,
    check_out          DATE           NOT NULL,
    nights             INT            GENERATED ALWAYS AS (check_out - check_in) STORED,
    guest_count        INT            NOT NULL DEFAULT 1,
    total_amount_ngn   NUMERIC(12,2)  NOT NULL,
    platform_fee_ngn   NUMERIC(12,2)  NOT NULL,
    host_payout_ngn    NUMERIC(12,2)  NOT NULL,
    status             booking_status NOT NULL DEFAULT 'pending_payment',
    cancellation_reason TEXT,
    cancelled_at       TIMESTAMPTZ,
    special_requests   TEXT,
    metadata           JSONB          NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT chk_checkout_after_checkin CHECK (check_out > check_in),
    CONSTRAINT chk_rooms_positive CHECK (rooms_count > 0)
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_tenant        ON bookings(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_bookings_guest         ON bookings(guest_user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_bookings_room_dates    ON bookings(room_type_id, check_in, check_out);
  CREATE INDEX IF NOT EXISTS idx_bookings_ref           ON bookings(booking_ref);
  CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status, created_at DESC);`,

  /* 011 payments */
  `CREATE TABLE IF NOT EXISTS payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id              UUID           NOT NULL REFERENCES bookings(id),
    tenant_id               UUID           NOT NULL REFERENCES tenants(id),
    guest_user_id           UUID           NOT NULL REFERENCES users(id),
    gateway                 payment_gateway NOT NULL,
    transaction_id          VARCHAR(150)   UNIQUE,
    amount_ngn              NUMERIC(12,2)  NOT NULL,
    status                  payment_status NOT NULL DEFAULT 'pending',
    channel                 VARCHAR(50),
    paid_at                 TIMESTAMPTZ,
    refunded_at             TIMESTAMPTZ,
    idempotency_key         VARCHAR(128)   NOT NULL UNIQUE,
    metadata                JSONB          NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_payments_booking     ON payments(booking_id);
  CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key);
  CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status, created_at DESC);`,

  /* 012 escrow_ledger */
  `CREATE TABLE IF NOT EXISTS escrow_ledger (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID          NOT NULL UNIQUE REFERENCES bookings(id),
    tenant_id        UUID          NOT NULL REFERENCES tenants(id),
    amount_ngn       NUMERIC(12,2) NOT NULL,
    platform_fee_ngn NUMERIC(12,2) NOT NULL,
    host_payout_ngn  NUMERIC(12,2) NOT NULL,
    status           escrow_status NOT NULL DEFAULT 'held',
    held_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    released_at      TIMESTAMPTZ,
    refunded_at      TIMESTAMPTZ,
    refund_amount_ngn NUMERIC(12,2),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_escrow_tenant  ON escrow_ledger(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_escrow_booking ON escrow_ledger(booking_id);`,

  /* 013 outbox */
  `CREATE TABLE IF NOT EXISTS outbox_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type   VARCHAR(100)  NOT NULL,
    payload      JSONB         NOT NULL,
    status       outbox_status NOT NULL DEFAULT 'pending',
    retry_count  INT           NOT NULL DEFAULT 0,
    last_error   TEXT,
    processed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_outbox_status  ON outbox_events(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_outbox_retry   ON outbox_events(status, retry_count);`,

  /* 014 webhook_logs */
  `CREATE TABLE IF NOT EXISTS webhook_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway        payment_gateway    NOT NULL,
    transaction_id VARCHAR(150)       NOT NULL,
    raw_payload    JSONB              NOT NULL,
    failure_reason TEXT,
    retry_count    INT                NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ       NOT NULL DEFAULT now(),
    next_retry_at  TIMESTAMPTZ,
    status         webhook_log_status NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ        NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_webhook_transaction ON webhook_logs(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_webhook_status      ON webhook_logs(status, next_retry_at);
  CREATE INDEX IF NOT EXISTS idx_webhook_gateway     ON webhook_logs(gateway, created_at DESC);`,

  /* 015 audit_logs */
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID,
    user_id     UUID,
    action      audit_action  NOT NULL,
    resource    VARCHAR(100)  NOT NULL,
    resource_id VARCHAR(200),
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    request_id  VARCHAR(100),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_audit_tenant   ON audit_logs(tenant_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_logs(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource, resource_id);
  CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_logs(action, created_at DESC);`,

  /* 016 sse_connections outbox */
  `CREATE TABLE IF NOT EXISTS sse_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    tenant_id  UUID         REFERENCES tenants(id),
    event_type VARCHAR(100) NOT NULL,
    payload    JSONB        NOT NULL,
    delivered  BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_sse_user    ON sse_events(user_id, delivered, created_at);
  CREATE INDEX IF NOT EXISTS idx_sse_created ON sse_events(created_at);`,
  /* 017 roles */
  `CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)  NOT NULL,
    slug        VARCHAR(100)  NOT NULL UNIQUE,
    description TEXT          NOT NULL,
    is_system   BOOLEAN       NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);`,

  /* 018 permissions */
  `CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource    VARCHAR(100)  NOT NULL,
    action      VARCHAR(100)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_permissions_resource_action UNIQUE(resource, action)
  );
  CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource, action);`,

  /* 019 role_permissions - M:N between roles and permissions */
  `CREATE TABLE IF NOT EXISTS role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_permission UNIQUE(role_id, permission_id)
  );
  CREATE INDEX IF NOT EXISTS idx_rp_role       ON role_permissions(role_id);
  CREATE INDEX IF NOT EXISTS idx_rp_permission ON role_permissions(permission_id);`,

  /* 020 user_roles - which role a user holds in a tenant */
  `CREATE TABLE IF NOT EXISTS user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id         UUID          NOT NULL REFERENCES roles(id)   ON DELETE RESTRICT,
    assigned_by     VARCHAR(100)  NOT NULL,
    assigned_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    reason          TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_tenant_role UNIQUE(user_id, tenant_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_roles_user        ON user_roles(user_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_user_roles_tenant      ON user_roles(tenant_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role        ON user_roles(role_id);`,

  /* 021 user_permissions - direct per-user overrides (grant OR deny) */
  `CREATE TABLE IF NOT EXISTS user_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    tenant_id       UUID          NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,
    permission_id   UUID          NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted         BOOLEAN       NOT NULL,
    assigned_by     VARCHAR(100)  NOT NULL,
    assigned_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    reason          TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_permission UNIQUE(user_id, tenant_id, permission_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_perm_user   ON user_permissions(user_id, tenant_id);
  CREATE INDEX IF NOT EXISTS idx_user_perm_perm   ON user_permissions(permission_id);`,

  /* 022 notifications */
  `DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
      'booking_confirmed','booking_cancelled','booking_checked_in',
      'booking_checked_out','payment_confirmed','payment_failed',
      'auth_otp','auth_registered','escrow_released','escrow_refunded'
    );
    CREATE TYPE notification_channel AS ENUM ('email','sms','email_and_sms');
    CREATE TYPE notification_status  AS ENUM ('pending','sent','failed','skipped');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type             notification_type    NOT NULL,
    channel          notification_channel NOT NULL,
    status           notification_status  NOT NULL DEFAULT 'pending',
    recipient_email  VARCHAR(255),
    recipient_phone  VARCHAR(30),
    tenant_id        UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id          UUID REFERENCES users(id)   ON DELETE SET NULL,
    subject          TEXT,
    message          TEXT                NOT NULL,
    metadata         JSONB               NOT NULL DEFAULT '{}',
    sent_at          TIMESTAMPTZ,
    failure_reason   TEXT,
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ         NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_notif_type_status ON notifications(type, status);
  CREATE INDEX IF NOT EXISTS idx_notif_tenant      ON notifications(tenant_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notif_user        ON notifications(user_id, created_at DESC);`,
  /* 022 booking receipts */
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS receipt_url TEXT`,

  /* 023 idempotency keys */
  `
  DO $$ BEGIN
    CREATE TYPE idempotency_status AS ENUM ('processing', 'completed', 'failed');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE TABLE IF NOT EXISTS idempotency_keys (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_hash   VARCHAR(64)         NOT NULL UNIQUE,
    endpoint       VARCHAR(150)        NOT NULL,
    user_id        UUID,
    status         idempotency_status  NOT NULL DEFAULT 'processing',
    status_code    INT,
    response_body  JSONB,
    failure_reason TEXT,
    expires_at     TIMESTAMPTZ         NOT NULL,
    created_at     TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ         NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_idempotency_hash    ON idempotency_keys(request_hash);
  CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
  CREATE INDEX IF NOT EXISTS idx_idempotency_status  ON idempotency_keys(status, created_at);
  `,

  // 24 Maintenance

  `
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_type_id UUID         NOT NULL REFERENCES room_types(id),
      tenant_id    UUID,
      title        VARCHAR(200) NOT NULL,
      description  TEXT,
      priority     VARCHAR(20)  NOT NULL DEFAULT 'medium',
      status       VARCHAR(20)  NOT NULL DEFAULT 'open',
      resolved_at  TIMESTAMPTZ,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_maintenance_room_type ON maintenance_requests(room_type_id, status);
  `,

  /** Rentals */
  `
  CREATE TABLE IF NOT EXISTS renters (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id                 UUID         NOT NULL REFERENCES tenants(id),
    full_name                VARCHAR(200) NOT NULL,
    email                    VARCHAR(255),
    phone                    VARCHAR(30),
    emergency_contact_name   VARCHAR(200),
    emergency_contact_phone  VARCHAR(30),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  ALTER TABLE renters ADD COLUMN IF NOT EXISTS guest_user_id UUID REFERENCES users(id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_renters_owner_guest ON renters(owner_id, guest_user_id) WHERE guest_user_id IS NOT NULL;
`,

// REVIEWS
`
  CREATE TABLE IF NOT EXISTS reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id        UUID          NOT NULL REFERENCES room_types(id),
    property_id         UUID          NOT NULL REFERENCES properties(id),
    tenant_id           UUID          NOT NULL REFERENCES tenants(id),
    guest_user_id       UUID          NOT NULL REFERENCES users(id),
    booking_id          UUID          NOT NULL REFERENCES bookings(id),
    rating              INT           NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title               VARCHAR(150)  NOT NULL,
    comment             TEXT          NOT NULL,
    images              TEXT[]        NOT NULL DEFAULT '{}',
    is_verified_purchase BOOLEAN      NOT NULL DEFAULT true,
    status              VARCHAR(20)   NOT NULL DEFAULT 'approved',
    helpful_count       INT           NOT NULL DEFAULT 0,
    unhelpful_count     INT           NOT NULL DEFAULT 0,
    response_text       TEXT,
    response_by         UUID REFERENCES users(id),
    response_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE(booking_id, room_type_id)
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_room_type ON reviews(room_type_id, status, rating DESC);
  CREATE INDEX IF NOT EXISTS idx_reviews_tenant    ON reviews(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_reviews_guest     ON reviews(guest_user_id);
`,

  /* 021 roles.tenant_id — custom, tenant-scoped roles alongside the seeded
     system roles. NULL tenant_id = system role (host:admin etc), visible to
     everyone. Slug uniqueness has to be split into two partial indexes:
     system role slugs stay globally unique, custom role slugs only need to
     be unique within their own tenant, since NULL != NULL in a plain
     UNIQUE(tenant_id, slug) constraint and would let two different tenants
     silently collide on "the same" system-role-shaped slug otherwise. */
  `ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
   ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_slug_key;
   DROP INDEX IF EXISTS idx_roles_slug;
   CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_system_slug ON roles(slug) WHERE tenant_id IS NULL;
   CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_tenant_slug ON roles(tenant_id, slug) WHERE tenant_id IS NOT NULL;
   CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);`,

  /* 022 users: transaction PIN + 2FA/phone-verification state.
     OTP codes themselves are NOT stored here, see security.service.ts,
     they live in Redis with a native TTL instead (short-lived,
     high-write-frequency, no need for durability or relational
     integrity, a plain Postgres UPDATE per OTP request is wasted write
     load on a table you actually care about querying/replicating). Only
     the durable outcomes (has a PIN, is 2FA on, is phone verified) live
     here. */
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash            VARCHAR(255);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified   BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled  BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS login_with_pin_enabled BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code        VARCHAR(5);`,

  /* Invoices: guest tax invoices (on-demand) and host payout statements
     (automatic at checkout). Two document types, one table, one row per
     (booking_id, type) so re-requesting an already-generated document
     returns the same one instead of creating a duplicate with a new
     number. Sequential numbering uses native Postgres SEQUENCEs, atomic
     and duplicate-proof under concurrency without hand-rolled locking
     (the same class of bug the booking availability fix addressed).
     Known simplification: these sequences climb forever, they don't
     reset to 1 each January the way some formal per-year numbering
     schemes do, the year in "INV-2026-000142" reflects when it was
     issued, not a per-year counter. Revisit only if a specific
     jurisdiction's invoice rules require strict per-year reset. */
  `CREATE SEQUENCE IF NOT EXISTS guest_invoice_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS host_statement_seq START 1;

   CREATE TABLE IF NOT EXISTS invoices (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     invoice_number  VARCHAR(50) UNIQUE NOT NULL,
     type            VARCHAR(20) NOT NULL CHECK (type IN ('guest_invoice', 'host_statement')),
     booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
     tenant_id       UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
     guest_user_id   UUID REFERENCES users(id),
     amount_ngn      NUMERIC(12,2) NOT NULL,
     pdf_url         TEXT,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (booking_id, type)
   );
   CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
   CREATE INDEX IF NOT EXISTS idx_invoices_tenant  ON invoices(tenant_id, type);`,

  /* In-app bell-icon notification feed for sellers/hosts. Deliberately a
     separate table from `notifications` (that one is an email/SMS
     delivery log: channel, recipient_email/phone, sent_at, failure_reason
     — no is_read concept, wrong shape for "click the bell, see a list").
     Populated by the isolated seller-notification-worker process, which
     consumes the same notification.events exchange the existing
     email/SMS worker already does, RabbitMQ topic exchanges support
     multiple independent queue bindings to the same routing key, so this
     is additive, no change needed to what already publishes these
     events. */
  `CREATE TABLE IF NOT EXISTS seller_notifications (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
     booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
     type        VARCHAR(30) NOT NULL CHECK (type IN ('booking_confirmed', 'booking_checked_in', 'booking_checked_out')),
     title       VARCHAR(200) NOT NULL,
     body        TEXT NOT NULL,
     is_read     BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS idx_seller_notifications_tenant ON seller_notifications(tenant_id, is_read, created_at DESC);`,

  /* Campaign notification system. Audience is resolved from a structured
     filter (see audience.resolver.ts), not a saved list, so a draft
     campaign's audience count stays live until send time, when it's
     snapshotted into campaign_recipients (one row per user per channel,
     that snapshot is what makes "who exactly got this" answerable after
     the fact, and what makes idempotent claim-based sending possible,
     the same discipline as the booking availability fix: atomic
     claim-before-send, not check-then-send). */
  `CREATE TABLE IF NOT EXISTS user_notification_preferences (
     user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     channel     VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
     category    VARCHAR(20) NOT NULL CHECK (category IN ('marketing', 'transactional')),
     opted_in    BOOLEAN NOT NULL DEFAULT true,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, channel, category)
   );

   CREATE TABLE IF NOT EXISTS campaigns (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
     name            VARCHAR(200) NOT NULL,
     status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
     audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
     channels        TEXT[] NOT NULL DEFAULT '{}',
     scheduled_at    TIMESTAMPTZ,
     created_by      UUID REFERENCES users(id),
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE TABLE IF NOT EXISTS campaign_templates (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
     channel      VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
     subject      VARCHAR(200),
     body         TEXT NOT NULL,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (campaign_id, channel)
   );

   CREATE TABLE IF NOT EXISTS campaign_recipients (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
     user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     channel      VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
     status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped_preference', 'skipped_provider_down')),
     attempt_count INTEGER NOT NULL DEFAULT 0,
     error        TEXT,
     sent_at      TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (campaign_id, user_id, channel)
   );
   CREATE INDEX IF NOT EXISTS idx_campaign_recipients_claim ON campaign_recipients(campaign_id, status);
   CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id, status);`,

  /* Generic, audience-agnostic in-app notification, keyed by user_id only
     (no tenant_id requirement), unlike seller_notifications (host/tenant
     dashboard bell, booking-lifecycle events only). This is what a
     campaign's in_app channel actually needs: a guest with no tenant_id
     can receive one too. Deliberately not merging this with
     seller_notifications, they have different audiences and different
     required columns (tenant_id NOT NULL there, nullable here), forcing
     one shape to fit both would mean either loosening a constraint that
     protects real data (tenant scoping on the host feed) or adding
     nullable columns nobody needs on the host side. */
  `CREATE TABLE IF NOT EXISTS user_notifications (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     source      VARCHAR(20) NOT NULL DEFAULT 'campaign' CHECK (source IN ('campaign', 'system')),
     campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
     title       VARCHAR(200) NOT NULL,
     body        TEXT NOT NULL,
     is_read     BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC);`,

  /* Core seller (host/tenant) public profile metadata: bio, avatar,
     location. Real dedicated columns, not the settings JSONB blob,
     that's operational config (timezone/currency/locale), this is
     public profile content a guest sees on the property page, deserves
     its own queryable columns the same way PropertyAddress does, not a
     schemaless bag. */
  `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bio         TEXT;
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS avatar_url  TEXT;
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city        VARCHAR(100);
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state       VARCHAR(100);
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country     VARCHAR(100);`,

  `CREATE TABLE IF NOT EXISTS favorites (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     guest_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (guest_user_id, property_id)
   );
   CREATE INDEX IF NOT EXISTS idx_favorites_guest ON favorites(guest_user_id, created_at DESC);`,

  /* Room type display order: only meaningful for the "custom" sort mode,
     every other mode (alphabetical/price/newest/oldest/rating) sorts by
     an existing real column, doesn't need this. NULL by default, custom
     order only applies to room types a host has explicitly reordered. */
  `ALTER TABLE room_types ADD COLUMN IF NOT EXISTS display_order INTEGER;
   ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_sort_mode VARCHAR(20) NOT NULL DEFAULT 'price'
     CHECK (room_sort_mode IN ('alphabetical', 'price', 'rating', 'newest', 'oldest', 'custom'));`,

  /* New audit_action value for PDF export/download actions. Previously
     there was no distinguishable action for "who downloaded/exported
     data", callers were about to misuse 'created' for something that
     isn't creating anything. Kept as its own migration entry since
     Postgres requires ADD VALUE to run outside the same transaction it's
     then used in. */
  `DO $$ BEGIN
     ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'exported';
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const sql of migrations) {
      await client.query(sql);
    }
    await client.query("COMMIT");
    logger.info("migrations_complete", {
      event: "migrations_complete",
      count: migrations.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}