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

output "node_security_group_id" {
  value = module.eks.node_security_group_id
}

data "aws_iam_roles" "node_group" {
  name_regex = "general-eks-node-group-.*"
}

output "node_iam_role_arn" {
  value = tolist(data.aws_iam_roles.node_group.arns)[0]
}

output "alb_controller_role_arn" {
  value = module.eks.alb_controller_role_arn
}

output "external_secrets_role_arn" {
  value = module.eks.external_secrets_role_arn
}

output "booking_backend_role_arn" {
  value = module.eks.booking_backend_role_arn
}