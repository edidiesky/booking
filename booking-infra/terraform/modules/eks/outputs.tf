output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  value = module.eks.cluster_certificate_authority_data
}

output "oidc_provider_arn" {
  value = module.eks.oidc_provider_arn
}

output "oidc_provider" {
  value = module.eks.oidc_provider
}

output "alb_controller_role_arn" {
  value = module.irsa_alb_controller.iam_role_arn
}

output "external_secrets_role_arn" {
  value = module.irsa_external_secrets.iam_role_arn
}

output "booking_backend_role_arn" {
  value = aws_iam_role.booking_backend.arn
}

output "node_security_group_id" {
  value = module.eks.node_security_group_id
}

output "node_iam_role_arn" {
  value = module.eks.eks_managed_node_groups["general"].iam_role_arn
}