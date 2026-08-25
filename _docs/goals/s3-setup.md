# 1. Configure the CLI with the key pair from the CSV
aws configure
# AWS Access Key ID: <from csv>
# AWS Secret Access Key: <from csv>
# Default region: <pick your region, e.g. eu-west-1>
# Default output format: json

# 2. Confirm it actually authenticates (real check, not assumed)
aws sts get-caller-identity

# 3. Create the backup bucket, if it doesn't exist yet
aws s3api create-bucket --bucket booking-pg-backups-463d5e40 \
  --region "us-east-2" \
  --create-bucket-configuration LocationConstraint="us-east-2"

# 4. Enable versioning (protects against a bad backup silently overwriting a good one)
aws s3api put-bucket-versioning --bucket booking-pg-backups-463d5e40 \
  --versioning-configuration Status=Enabled

# 5. Enable default encryption at rest
aws s3api put-bucket-encryption --bucket booking-pg-backups-463d5e40 \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# 6. Confirm all three, real output, not assumed
aws s3api get-bucket-versioning --bucket booking-pg-backups-463d5e40
aws s3api get-bucket-encryption --bucket booking-pg-backups-463d5e40
aws s3api get-bucket-location --bucket booking-pg-backups-463d5e40


# Confirm the exact IAM username first, don't guess it
aws sts get-caller-identity

# If it's an IAM user (not root), attach the scoped policy.
# Replace <username> with the real Arn's user segment from the command above.
aws iam put-user-policy \
  --user-name <username> \
  --policy-name booking-pg-backups-s3-only \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
        "Resource": [
          "arn:aws:s3:::booking-pg-backups-463d5e40",
          "arn:aws:s3:::booking-pg-backups-463d5e40/*"
        ]
      }
    ]
  }'

# Confirm it actually attached, real check
aws iam list-user-policies --user-name <username>
aws iam get-user-policy --user-name <username> --policy-name booking-pg-backups-s3-only