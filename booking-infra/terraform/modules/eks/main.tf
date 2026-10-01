locals {
  name = "${var.project}-${var.environment}"

  tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "eks"
  })
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = "${local.name}-eks"
  kubernetes_version = var.cluster_version

  vpc_id                   = var.vpc_id
  subnet_ids               = var.private_subnet_ids
  control_plane_subnet_ids = var.private_subnet_ids

  endpoint_private_access = true
  endpoint_public_access  = true

  enable_irsa = true

  addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  eks_managed_node_groups = {
    for name, config in var.node_groups : name => {
      instance_types         = config.instance_types
      min_size               = config.min_size
      max_size               = config.max_size
      desired_size           = config.desired_size
      vpc_security_group_ids = [var.eks_nodes_sg_id]
      labels                 = config.labels
      taints                 = config.taints
      update_config = {
        max_unavailable_percentage = 25
      }
      tags = local.tags
    }
  }

  tags = local.tags
}

# IRSA: AWS Load Balancer Controller
module "irsa_alb_controller" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name                              = "${local.name}-alb-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }

  tags = local.tags
}

# IRSA: External Secrets Operator
module "irsa_external_secrets" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name                             = "${local.name}-external-secrets"
  attach_external_secrets_policy        = true
  external_secrets_secrets_manager_arns = ["arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.project}/${var.environment}/*"]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["external-secrets:external-secrets"]
    }
  }

  tags = local.tags
}

# IRSA: Booking Backend pod identity
resource "aws_iam_role" "booking_backend" {
  name = "${local.name}-booking-backend"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = module.eks.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${module.eks.oidc_provider}:sub" = "system:serviceaccount:default:booking-backend"
          "${module.eks.oidc_provider}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "booking_backend_secrets" {
  name = "${local.name}-backend-secrets"
  role = aws_iam_role.booking_backend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.project}/${var.environment}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "arn:aws:s3:::${var.project}-${var.environment}-assets/*"
      }
    ]
  })
}