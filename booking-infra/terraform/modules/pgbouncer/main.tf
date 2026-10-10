
resource "aws_secretsmanager_secret" "pgbouncer_userlist" {
  name                    = "${var.project}/${var.environment}/pgbouncer-userlist"
  description             = "PgBouncer userlist.txt with SCRAM-SHA-256 verifiers"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Placeholder populated post-migration via AWS CLI or manual step
# See SCRAM-SHA-256 note in Phase 4 instructions
resource "aws_secretsmanager_secret_version" "pgbouncer_userlist" {
  secret_id = aws_secretsmanager_secret.pgbouncer_userlist.id
  secret_string = jsonencode({
    booking_app    = "SCRAM-SHA-256$REPLACE_AFTER_MIGRATION"
    booking_worker = "SCRAM-SHA-256$REPLACE_AFTER_MIGRATION"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

output "pgbouncer_userlist_secret_arn" {
  value = aws_secretsmanager_secret.pgbouncer_userlist.arn
}