/* New audit_action value for PDF export/download actions. Previously
     there was no distinguishable action for "who downloaded/exported
     data", callers were about to misuse 'created' for something that
     isn't creating anything. Kept as its own migration entry since
     Postgres requires ADD VALUE to run outside the same transaction it's
     then used in. */
DO $$ BEGIN
     ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'exported';
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
