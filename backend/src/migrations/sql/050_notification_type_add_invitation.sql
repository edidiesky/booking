
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;