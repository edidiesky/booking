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

output "vpc_id" {
  value = module.networking.vpc_id
}

output "private_subnet_ids" {
  value = module.networking.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}