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

variable "vpc_id" {
  type        = string
  description = "VPC ID from networking module"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for EKS nodes"
}

variable "eks_nodes_sg_id" {
  type        = string
  description = "Security group ID for EKS worker nodes"
}

variable "cluster_version" {
  type        = string
  description = "Kubernetes version"
  default     = "1.33"
}

variable "node_groups" {
  description = "Map of node group configurations"
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
    labels         = map(string)
    taints = map(object({
      key    = string
      value  = optional(string)
      effect = string
    }))
  }))
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}