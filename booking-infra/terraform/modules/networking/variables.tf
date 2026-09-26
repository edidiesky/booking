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

# project
variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod"
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of AZs"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets"
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Enable NAT gateway"
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}