output "cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS cluster API endpoint"
}

output "cluster_certificate_authority_data" {
  value       = module.eks.cluster_certificate_authority_data
  description = "Base64 encoded certificate authority data"
}

output "oidc_provider_arn" {
  value       = module.eks.oidc_provider_arn
  description = "OIDC provider ARN for IRSA"
}

output "alb_controller_role_arn" {
  value       = module.irsa_alb_controller.iam_role_arn
  description = "IAM role ARN for AWS Load Balancer Controller"
}

output "external_secrets_role_arn" {
  value       = module.irsa_external_secrets.iam_role_arn
  description = "IAM role ARN for External Secrets Operator"
}

output "booking_backend_role_arn" {
  value       = aws_iam_role.booking_backend.arn
  description = "IAM role ARN for booking backend pods"
}

output "node_security_group_id" {
  value       = module.eks.node_security_group_id
  description = "Security group ID created by EKS for nodes"
}
