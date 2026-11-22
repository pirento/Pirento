# Three zones in Mumbai: public subnets for the load balancer and NAT, private ones for the services and the
# AWS data stores. One NAT gateway per zone, so losing a zone does not cut the others off.
data "aws_availability_zones" "up" { state = "available" }

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.16"

  name               = var.project
  cidr               = "10.20.0.0/16"
  azs                = slice(data.aws_availability_zones.up.names, 0, 3)
  public_subnets     = ["10.20.0.0/20", "10.20.16.0/20", "10.20.32.0/20"]
  private_subnets    = ["10.20.64.0/18", "10.20.128.0/18", "10.20.192.0/19"]
  enable_nat_gateway = true
  single_nat_gateway = false
  one_nat_gateway_per_az = true
  enable_dns_hostnames   = true
}

# Services talk to each other and to the data stores only inside the VPC.
resource "aws_security_group" "services" {
  name   = "${var.project}-services"
  vpc_id = module.vpc.vpc_id
  ingress {
    description = "service to service, and the load balancer to the gateway"
    from_port   = 4000
    to_port     = 4009
    protocol    = "tcp"
    self        = true
  }
  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "data" {
  name   = "${var.project}-data"
  vpc_id = module.vpc.vpc_id
  dynamic "ingress" {
    for_each = { postgres = 5432, redis = 6379, opensearch = 443 }
    content {
      description     = ingress.key
      from_port       = ingress.value
      to_port         = ingress.value
      protocol        = "tcp"
      security_groups = [aws_security_group.services.id]
    }
  }
  # RDS Proxy (in this group) reaching Aurora (in this group too).
  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"
    self      = true
  }
  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }
}
