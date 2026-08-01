# ADR: A Maintained, Project-Specific Security Setup Document

## Status
Accepted.

## Context
Database role architecture, RLS coverage, and PgBouncer configuration were, until this work, tribal knowledge: correct in the moment for whoever set them up, undocumented, and unverifiable by anyone else without re-deriving it from source. This showed up concretely: the actual running database had only `postgres` and a monitoring role, `booking_app`/`booking_worker` existed in design and in code (RLS policies, connection routing logic) but not as real, created roles, a gap that a written, current document would have caught immediately and that reading application code alone did not surface.

A generic security guide (roles, `pg_hba.conf`, RLS, PgBouncer, in the abstract) was reviewed earlier and is useful as a reference for *concepts*, but a generic guide cannot tell you whether *this* deployment's `userlist.txt` actually has an entry for `booking_app`, or whether *this* PgBouncer is in transaction mode. Only a document grounded in the real schema, the real compose file, and the real running roles can do that, and only if someone keeps it current as those things change.

## Decision

Maintain `docs/database-security-setup.md` as a living, project-specific reference, not a one-time writeup. It documents:

- The actual two-role architecture (`booking_app`, `booking_worker`) and which services use which.
- The real, table-by-table RLS coverage as-built, including what's explicitly *not* covered yet and why.
- Verification queries to run after any change, not just after the initial rollout, `SET ROLE booking_app; SELECT count(*) FROM bookings;` returning zero is the actual proof RLS is enforced, not the migration having run without error.
- Open decisions stated explicitly rather than silently resolved (e.g., whether a nullable `tenant_id` on a given table is intentional platform-wide data or a data-quality gap).

This document is treated as **part of the deployment surface**, updated in the same change as any role, policy, or pooling configuration change, not as after-the-fact documentation written once and left to drift.

## Consequences

- Onboarding a new engineer to the database's security posture means reading one current document, not reconstructing intent from migrations, docker-compose, and PgBouncer config independently and hoping they agree.
- The verification queries section specifically exists because "the code looks right" and "the enforcement is actually live" turned out to be different questions in this exact codebase, the RLS policies were correct in every migration file while the connecting role remained a superuser that bypassed them entirely. A document that only describes the intended design, without a way to test the actual running state, would not have caught this.
- This creates an ongoing maintenance obligation, not a one-time cost. A role rotated, a table added without RLS consideration, or a PgBouncer pool_mode changed without updating this document reintroduces the exact kind of undocumented-tribal-knowledge gap this ADR exists to close. The document's value is proportional to how consistently it's kept current, not to how thorough it was on the day it was written.
- Secrets (passwords, API keys) are explicitly **not** stored in this document, connection string *shapes* and role *names* are documented, actual credential values are not, and any credential that has appeared in an insecure channel (a chat log, a ticket, a message) is treated as compromised and rotated, independent of this document's scope.

## Alternatives considered

- **No dedicated document, rely on code + migrations as the source of truth**: rejected, this is exactly the status quo that let the role-creation gap go unnoticed, code describes intent, not the state of a live, mutable system like a database's role table.
- **A generic, non-project-specific security guide**: rejected as insufficient on its own, useful for concepts, not for answering "is *this* deployment actually configured correctly right now."