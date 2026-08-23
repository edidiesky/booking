/**
 * registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest
 * node group: registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eks_node_group
 * IAM: registry.terraform.io/modules/terraform-aws-modules/iam/aws/latest/submodules/iam-role-for-service-accounts-eks
*/

/**
* Core variables
* 1. aws region
* 2. environment
* 2. project name
* 3. vpc id
* 4. private subnet
* 4. eks node sg id
* 4. cluster version
* 4. nodes group
*/
variable "aws_region" {
  type = string
  description = "AWS Region"
}

variable "project" {
  type = string
  description = "EKS project"
}


variable "environment" {
  type = string
  default = "dev"
  description = "Deployment environment"
  validation {
    error_message = "Must be either dev, staging or prod"
    condition = contains(["dev", "prod", "staging"], var.environment)
  }
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