# PROVISIONING POSTGRES ROLES 
-- Run once, as a Postgres superuser (you already have this via the
-- `postgres` role). Creates the two-role split documented in
-- ADR-tenant-rls-role-separation.md: booking_app (RLS-subject, used by
-- the main backend) and booking_worker (BYPASSRLS, used by all six
-- isolated workers and the popular-properties refresh scheduler).
--
-- Replace both placeholder passwords before running. Do not commit
-- this file with real passwords filled in, keep the placeholders in
-- version control and fill them in only at the point of execution.

CREATE ROLE booking_app
  WITH LOGIN
  PASSWORD 'REPLACE_WITH_A_REAL_SECRET'
  CONNECTION LIMIT 100;

CREATE ROLE booking_worker
  WITH LOGIN
  PASSWORD 'REPLACE_WITH_A_DIFFERENT_REAL_SECRET'
  BYPASSRLS
  CONNECTION LIMIT 30;

GRANT CONNECT ON DATABASE booking_platform TO booking_app, booking_worker;
GRANT USAGE ON SCHEMA public TO booking_app, booking_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO booking_app, booking_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO booking_app, booking_worker;

-- Future tables (every new migration this project adds) need this too,
-- or a new table silently isn't granted and the next thing that
-- touches it breaks in production, not in review.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO booking_app, booking_worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO booking_app, booking_worker;

-- Verification, run immediately after. booking_app must show f,
-- booking_worker must show t. If either is wrong, stop here, nothing
-- downstream of this is safe to proceed with.
SELECT rolname, rolbypassrls, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('booking_app', 'booking_worker');

-- Extract the SCRAM hashes needed for pgbouncer's userlist.txt, copy
-- the rolpassword values exactly, see userlist-entries.md in this same
-- directory for the format to paste them into.
SELECT rolname, rolpassword FROM pg_authid WHERE rolname IN ('booking_app', 'booking_worker');

# PgBouncer userlist.txt entries needed
 
After running `setup-roles.sql`, its final query outputs `rolname` /
`rolpassword` pairs for `booking_app` and `booking_worker`. PgBouncer
authenticates clients against `userlist.txt` *before* ever reaching
Postgres, creating the roles in Postgres alone does nothing here,
connections using them will be rejected at the PgBouncer layer without
this step.
 
Add two lines to `pgbouncer/userlist.txt`, same format as the existing
`postgres` entry already in that file:
 
```
"booking_app" "SCRAM-SHA-256$<paste the exact rolpassword value>"
"booking_worker" "SCRAM-SHA-256$<paste the exact rolpassword value>"
```
 
Then reload PgBouncer without a full restart:
 
```
docker exec pgbouncer psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "RELOAD;"
```
 
No `[databases]` change needed, the existing `booking_platform` entry
has no `user=` param, meaning PgBouncer passes through whatever
username the client connects as, both new roles will route correctly
once they're in this file.
 