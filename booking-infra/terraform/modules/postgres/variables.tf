
variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for RDS subnet group"
}

variable "rds_sg_id" {
  type        = string
  description = "Security group ID for RDS"
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "booking"
}

variable "db_username" {
  type        = string
  description = "Admin database username"
  default     = "booking_admin"
}

variable "db_password" {
  type        = string
  description = "Admin database password"
  sensitive   = true
}

variable "instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage in GB"
  default     = 20
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}