/*
 * 1. define environment variable
 * 2. define project name variable
 * 2. define aws region variable
*/

variable "aws_region" {
  default = "us-east-1"
  type = string
  description = "AWS Region to deploy into for this project"
}

variable "project" {
  default = "booking"
  type = string
  description = "AWS Region to deploy into for this project"
}