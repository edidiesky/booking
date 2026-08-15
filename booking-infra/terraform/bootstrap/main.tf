provider "aws" {
  region = var.aws_region
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "terraform_state" {
  bucket        = "booking-tfstate-${var.project}-${random_id.suffix.hex}"
  force_destroy = true

  tags = {
    Name      = "booking-terraform-state"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "booking-terraform-locks-${var.project}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name      = "booking-terraform-locks"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

output "bucket_name" {
  value       = aws_s3_bucket.terraform_state.bucket
  description = "S3 bucket for Terraform state"
}

output "dynamodb_table" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "DynamoDB table for state locking"
}

output "aws_region" {
  value = var.aws_region
}

output "backend_config" {
  value = <<-EOT
    bucket       = "${aws_s3_bucket.terraform_state.bucket}"
    key          = "booking/<ENV>/terraform.tfstate"
    region       = "${var.aws_region}"
    use_lockfile = true
    encrypt      = true
  EOT
  description = "Paste this into each env backend block, replace <ENV>"
}