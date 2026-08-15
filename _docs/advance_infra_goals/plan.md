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