/*
* 1. define environment
* 2. define project
* 3. define aws_region
* 4. define vpc_cidrs
* 5. define availability_zones
* 6. define private_subnet_cidrs
* 6. define public_subnet_cidrs
* 7. define enable_nat_gateway
* 8. define tags
*/

// environment
variable "environment" {
  type = string
  description = "Deployment environment"
  validation {
    condition = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment variable has to be either dev, staging or production"
  }
}

// project
variable "project" {
  type = string
  default = "booking"
  description = "Project name"
}

// aws_region
variable "aws_region" {
  type = string
  description = "AWS region"
}

// vpc_cidr
variable "vpc_cidr" {
  type = string
  description = "VPC CIDRS block"
  default = "10.0.0.0/16" 
}

// availability_zones
variable "availability_zones" {
  type = list(string)
  description = "List of Availability zones to deploy into"
}

// private_subnet_cidrs
variable "private_subnet_cidrs" {
  type = list(string)
  description = "List of Private Subnet CIDRS (EKS, Redis, RDS)"
}

// public_subnet_cidrs
variable "public_subnet_cidrs" {
  type = list(string)
  description = "List of Public Subnet CIDRS (NAT, ALB, RDS)"
}

// enable_nat_gateway
variable "enable_nat_gateway" {
  type = bool
  description = "Enable NAT gateway for private subnet internet access"
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}