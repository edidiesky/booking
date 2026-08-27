infra(terraform): phase 0 - bootstrap S3 state bucket and DynamoDB lock table
infra(terraform): phase 1 - networking module VPC subnets and security groups
infra(terraform): phase 2 - EKS cluster module and node groups
infra(terraform): phase 3 - RDS PostgreSQL module
infra(terraform): phase 4 - PgBouncer sidecar config and SCRAM-SHA-256 userlist
infra(terraform): phase 5 - ElastiCache Redis module
infra(terraform): phase 6 - Amazon MQ RabbitMQ module
infra(terraform): phase 7 - OpenSearch module
infra(terraform): phase 8 - Secrets Manager module
infra(terraform): phase 9 - ECR repositories module
infra(terraform): phase 10 - backend K8s deployment service and HPA
infra(terraform): phase 11 - worker K8s deployments and KEDA HPA
infra(terraform): phase 12 - ALB ingress and ACM cert
infra(terraform): phase 13 - dev staging prod env compositions
infra(terraform): phase 14 - GitHub Actions plan and apply workflows    


1. PITR automation script + checkpoint verification (2 markdown)
   STATUS: Not started.
   We have real manual proof for both (A3's actual restore, though
   never scripted; A6's checkpoint logic, though never crash-tested),
   but no repeatable script exists for either yet. Ready to build,
   nothing blocking it.

2. Why archiving strategy (bookings/audit_logs/outbox/payments)
   STATUS: Answered, already given, real reasoning (unbounded growth,
   backup time/size, outbox table bloat, compliance retention vs
   performance retention being different things, cost).
   The actual design/build (A5) is still not started.

3. Job cancellation API + retry a specific job
   STATUS: Not started (F5). Checkpoint progress tracking (A6) exists
   as a real foundation to build this on, cancellation/retry
   themselves don't exist.

4. Structured audit trails from auditlog.dev
   STATUS: In progress, interrupted mid-setup. Real gap analysis done
   (existing audit_logs contradicts the source's core thesis), schema
   designed, migration strategy confirmed with you (new audit_events
   table, backfill, deprecate old). Branch command given
   (feat/structured-audit-events), never confirmed run. Nothing
   actually built yet.

5. ADR on the audit log pattern
   STATUS: Not written yet, was queued to happen alongside #4 on the
   same branch, same interruption.

6. EXPLAIN ANALYZE docs on hot read paths, unique markdowns
   STATUS: Not started (F6). Real constraint worth flagging now, not
   after: I have no live database with real data volumes in this
   sandbox, so I can produce the real queries, the methodology, and
   what to look for in the output, but not fabricate actual EXPLAIN
   ANALYZE plan output, that has to come from you running it against
   real data.

7. Observability
   STATUS: Not started at all (B1-B6). This is the single largest
   remaining item on the whole list, six sub-items, needs its own
   scoping pass before anything gets built.

8. Move to tests writing
   STATUS: Not started (D1-D5, D7). D6 has a real manual proof (A3)
   but no script, same as item 1. Zero automated tests exist for
   anything built this session.

9. Clarify why we need RLS / C2 / C3 / C4 "since implemented"
   STATUS: Answered, corrected. C2 is genuinely done. C1, C3, C4 are
   real but partial, narrower gaps than originally assumed, restated
   in full two messages ago.

10. Feature flags
    STATUS: Not started (F3).

11. (blank)
    Nothing here to act on, let me know if this got cut off.