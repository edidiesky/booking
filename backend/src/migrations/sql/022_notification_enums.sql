/* 022 notifications */

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
      'booking_confirmed','booking_cancelled','booking_checked_in',
      'booking_checked_out','payment_confirmed','payment_failed',
      'auth_otp','auth_registered','escrow_released','escrow_refunded'
    );
    CREATE TYPE notification_channel AS ENUM ('email','sms','email_and_sms');
    CREATE TYPE notification_status  AS ENUM ('pending','sent','failed','skipped');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
