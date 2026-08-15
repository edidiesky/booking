terraform {
  required_version = "~> 1.14"

  backend "s3" {
    bucket       = "booking-tfstate-booking-146e838c"
    key          = "booking/dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}