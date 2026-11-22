# Pirento on AWS (Mumbai, ap-south-1). One `terraform apply` builds the network, the load balancer and CDN, the
# services on ECS Fargate with auto-scaling, and the data stores with their backups. See README.md first.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws          = { source = "hashicorp/aws", version = "~> 5.80" }
    mongodbatlas = { source = "mongodb/mongodbatlas", version = "~> 1.21" }
    random       = { source = "hashicorp/random", version = "~> 3.6" }
  }
  # State lives in S3 with a lock table, made once by hand (README.md, step 1).
  backend "s3" {}
}

provider "aws" {
  region = var.region
  default_tags { tags = { project = var.project, managed_by = "terraform" } }
}

# CloudFront certificates and WAF for CloudFront must be in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags { tags = { project = var.project, managed_by = "terraform" } }
}

# Keys come from MONGODB_ATLAS_PUBLIC_KEY / MONGODB_ATLAS_PRIVATE_KEY in the environment.
provider "mongodbatlas" {}
