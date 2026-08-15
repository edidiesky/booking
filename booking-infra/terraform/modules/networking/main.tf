/*
* 1. define vpc mdoul block
* 2. define resource security grous for eks
* 3. define resource security grous for rds
* 4. define resource security grous for eks
* 5. define resource security grous for rabbitmq
* 6. define resource security grous for elasticsearch
*/
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway     = var.enable_nat_gateway
  single_nat_gateway     = var.environment == "dev" ? true : false
  one_nat_gateway_per_az = var.environment == "prod" ? true : false

  enable_dns_hostnames = true
  enable_dns_support   = true

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"         = "1"
    "kubernetes.io/cluster/${local.name}-eks" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/role/elb"                  = "1"
    "kubernetes.io/cluster/${local.name}-eks" = "shared"
  }

  tags = local.tags
}

#  EKS Nodes Security Group 
resource "aws_security_group" "eks_nodes" {
  name        = "${local.name}-eks-nodes-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = module.vpc.vpc_id
  tags        = merge(local.tags, { Name = "${local.name}-eks-nodes-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "eks_nodes_self" {
  security_group_id            = aws_security_group.eks_nodes.id
  referenced_security_group_id = aws_security_group.eks_nodes.id
  ip_protocol                  = "-1"
  description                  = "Allow nodes to communicate with each other"
}

resource "aws_vpc_security_group_ingress_rule" "eks_nodes_alb" {
  security_group_id = aws_security_group.eks_nodes.id
  cidr_ipv4         = var.vpc_cidr
  from_port         = 1025
  to_port           = 65535
  ip_protocol       = "tcp"
  description       = "Allow ALB to reach node ports"
}

resource "aws_vpc_security_group_egress_rule" "eks_nodes_all" {
  security_group_id = aws_security_group.eks_nodes.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound"
}

#  RDS Security Group 
resource "aws_security_group" "rds" {
  name        = "${local.name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id
  tags        = merge(local.tags, { Name = "${local.name}-rds-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_eks" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.eks_nodes.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "PostgreSQL from EKS nodes only"
}

resource "aws_vpc_security_group_egress_rule" "rds_all" {
  security_group_id = aws_security_group.rds.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound"
}

#  Redis Security Group 
resource "aws_security_group" "redis" {
  name        = "${local.name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id
  tags        = merge(local.tags, { Name = "${local.name}-redis-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_eks" {
  security_group_id            = aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.eks_nodes.id
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
  description                  = "Redis from EKS nodes only"
}

resource "aws_vpc_security_group_egress_rule" "redis_all" {
  security_group_id = aws_security_group.redis.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound"
}

#  RabbitMQ Security Group 
resource "aws_security_group" "rabbitmq" {
  name        = "${local.name}-rabbitmq-sg"
  description = "Security group for Amazon MQ RabbitMQ"
  vpc_id      = module.vpc.vpc_id
  tags        = merge(local.tags, { Name = "${local.name}-rabbitmq-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "rabbitmq_amqp_from_eks" {
  security_group_id            = aws_security_group.rabbitmq.id
  referenced_security_group_id = aws_security_group.eks_nodes.id
  from_port                    = 5671
  to_port                      = 5671
  ip_protocol                  = "tcp"
  description                  = "AMQPS from EKS nodes only"
}

resource "aws_vpc_security_group_ingress_rule" "rabbitmq_mgmt_from_eks" {
  security_group_id            = aws_security_group.rabbitmq.id
  referenced_security_group_id = aws_security_group.eks_nodes.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "RabbitMQ management UI from EKS nodes only"
}

resource "aws_vpc_security_group_egress_rule" "rabbitmq_all" {
  security_group_id = aws_security_group.rabbitmq.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound"
}

#  OpenSearch Security Group 
resource "aws_security_group" "elasticsearch" {
  name        = "${local.name}-es-sg"
  description = "Security group for OpenSearch"
  vpc_id      = module.vpc.vpc_id
  tags        = merge(local.tags, { Name = "${local.name}-es-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "es_from_eks" {
  security_group_id            = aws_security_group.elasticsearch.id
  referenced_security_group_id = aws_security_group.eks_nodes.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS from EKS nodes only"
}

resource "aws_vpc_security_group_egress_rule" "es_all" {
  security_group_id = aws_security_group.elasticsearch.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound"
}