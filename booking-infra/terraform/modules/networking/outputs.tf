/*
* 1. vpc_id
* 2. vpc_cidr
* 3. vpc private subnets ids
* 3. vpc public subnets ids
* 4. eks node sg ids
* 4. redis node sg ids
* 4. elasticsearch node sg ids
* 4. rabbitmq node sg ids
*/

output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "VPC ID"
}

output "vpc_cidr" {
  value       = module.vpc.vpc_cidr_block
  description = "VPC CIDR block"
}

output "private_subnet_ids" {
  value       = module.vpc.private_subnets
  description = "Private subnet IDs for EKS nodes, RDS, Redis"
}

output "public_subnet_ids" {
  value       = module.vpc.public_subnets
  description = "Public subnet IDs for ALB and NAT"
}

output "eks_nodes_sg_id" {
  value       = aws_security_group.eks_nodes.id
  description = "Security group ID for EKS worker nodes"
}

output "rds_sg_id" {
  value       = aws_security_group.rds.id
  description = "Security group ID for RDS"
}

output "redis_sg_id" {
  value       = aws_security_group.redis.id
  description = "Security group ID for Redis"
}

output "rabbitmq_sg_id" {
  value       = aws_security_group.rabbitmq.id
  description = "Security group ID for RabbitMQ"
}

output "elasticsearch_sg_id" {
  value       = aws_security_group.elasticsearch.id
  description = "Security group ID for OpenSearch"
}