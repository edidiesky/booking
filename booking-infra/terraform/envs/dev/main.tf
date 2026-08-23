module "networking" {
  source = "../../modules/networking"

  project     = "booking"
  environment = "dev"
  aws_region  = "us-east-1"

  vpc_cidr = "10.0.0.0/16"

  availability_zones   = ["us-east-1a", "us-east-1b"]
  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true

  tags = {
    Project     = "booking"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

module "eks" {
  source = "../../modules/eks"

  project     = "booking"
  environment = "dev"
  aws_region  = "us-east-1"

  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  eks_nodes_sg_id    = module.networking.eks_nodes_sg_id

  cluster_version = "1.33"

  node_groups = {
    general = {
      instance_types = ["t3.medium"]
      min_size       = 2
      max_size       = 4
      desired_size   = 2
      labels = {
        role = "general"
      }
      taints = {}
    }
  }

  tags = {
    Project     = "booking"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

output "vpc_id" {
  value = module.networking.vpc_id
}

output "private_subnet_ids" {
  value = module.networking.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "alb_controller_role_arn" {
  value = module.eks.alb_controller_role_arn
}

output "external_secrets_role_arn" {
  value = module.eks.external_secrets_role_arn
}
