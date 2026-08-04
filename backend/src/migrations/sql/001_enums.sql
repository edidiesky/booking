
DO $$ BEGIN
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
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
