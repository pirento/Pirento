# The data stores. Each service still owns its own database: one Atlas cluster with a database (and a database
# user that can reach only that database) per service; the wallet's money in Aurora PostgreSQL; Redis for the
# shared cache and rate limits; OpenSearch for search; S3 for videos. All in Mumbai, all with backups.

# ---- MongoDB Atlas (on AWS, Mumbai) ----------------------------------------------------------------------------
resource "mongodbatlas_project" "main" {
  name   = var.project
  org_id = var.atlas_org_id
}

resource "mongodbatlas_advanced_cluster" "main" {
  project_id     = mongodbatlas_project.main.id
  name           = var.project
  cluster_type   = "REPLICASET" # switch to SHARDED when one database outgrows the largest tier (docs/SCALING.md)
  backup_enabled = true
  pit_enabled    = true # restore to any second in the backup window

  replication_specs {
    region_configs {
      provider_name = "AWS"
      region_name   = "AP_SOUTH_1"
      priority      = 7
      electable_specs {
        instance_size = var.atlas_instance_size
        node_count    = 3 # one per zone: a zone can fail without losing writes
      }
      auto_scaling {
        compute_enabled            = true
        compute_scale_down_enabled = true
        compute_max_instance_size  = "M80"
        compute_min_instance_size  = var.atlas_instance_size
        disk_gb_enabled            = true
      }
    }
  }
  advanced_configuration {
    minimum_enabled_tls_protocol = "TLS1_2"
  }
  lifecycle { prevent_destroy = true }
}

# Daily snapshots kept 30 days, weekly 12 weeks, monthly 12 months, on top of point-in-time restore.
resource "mongodbatlas_cloud_backup_schedule" "main" {
  project_id   = mongodbatlas_project.main.id
  cluster_name = mongodbatlas_advanced_cluster.main.name
  reference_hour_of_day    = 21 # 02:30 India time
  reference_minute_of_hour = 0
  restore_window_days      = 7
  policy_item_daily {
    frequency_interval = 1
    retention_unit     = "days"
    retention_value    = 30
  }
  policy_item_weekly {
    frequency_interval = 1
    retention_unit     = "weeks"
    retention_value    = 12
  }
  policy_item_monthly {
    frequency_interval = 1
    retention_unit     = "months"
    retention_value    = 12
  }
}

# Only our NAT addresses may connect.
resource "mongodbatlas_project_ip_access_list" "nat" {
  for_each   = toset(module.vpc.nat_public_ips)
  project_id = mongodbatlas_project.main.id
  ip_address = each.value
  comment    = "${var.project} NAT"
}

locals {
  mongo_services = ["auth", "catalog", "orders", "identity", "learning", "vault", "support", "ai", "green"]
  mongo_host     = trimprefix(mongodbatlas_advanced_cluster.main.connection_strings[0].standard_srv, "mongodb+srv://")
}

resource "random_password" "mongo" {
  for_each = toset(local.mongo_services)
  length   = 32
  special  = false
}

resource "mongodbatlas_database_user" "service" {
  for_each           = toset(local.mongo_services)
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "admin"
  username           = "${var.project}-${each.key}"
  password           = random_password.mongo[each.key].result
  roles {
    role_name     = "readWrite"
    database_name = "pirento_${each.key}"
  }
}

# ---- Aurora PostgreSQL (the wallet) ---------------------------------------------------------------------------
resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = var.project
  subnet_ids = module.vpc.private_subnets
}

resource "aws_rds_cluster" "wallet" {
  cluster_identifier          = "${var.project}-wallet"
  engine                      = "aurora-postgresql"
  engine_version              = "16.4"
  database_name               = "pirento_wallet"
  master_username             = "pirento"
  master_password             = random_password.postgres.result
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.data.id]
  storage_encrypted           = true
  backup_retention_period     = 35 # daily, plus point-in-time restore within these days
  preferred_backup_window     = "20:30-21:30"
  copy_tags_to_snapshot       = true
  deletion_protection         = true
  final_snapshot_identifier   = "${var.project}-wallet-final"
  serverlessv2_scaling_configuration {
    min_capacity = 2
    max_capacity = 64
  }
  lifecycle { prevent_destroy = true }
}

# A writer and a reader in another zone: the reader takes over in about 30 s if the writer's zone fails.
resource "aws_rds_cluster_instance" "wallet" {
  count               = 2
  identifier          = "${var.project}-wallet-${count.index}"
  cluster_identifier  = aws_rds_cluster.wallet.id
  instance_class      = "db.serverless"
  engine              = aws_rds_cluster.wallet.engine
  engine_version      = aws_rds_cluster.wallet.engine_version
  availability_zone   = module.vpc.azs[count.index]
  performance_insights_enabled = true
}

# RDS Proxy pools connections, so a hundred wallet copies do not each hold twenty connections to Aurora, and a
# failover does not drop the app's connections.
resource "aws_secretsmanager_secret" "postgres_login" {
  name = "${var.project}/postgres-login"
}

resource "aws_secretsmanager_secret_version" "postgres_login" {
  secret_id     = aws_secretsmanager_secret.postgres_login.id
  secret_string = jsonencode({ username = "pirento", password = random_password.postgres.result })
}

resource "aws_iam_role" "rds_proxy" {
  name = "${var.project}-rds-proxy"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "rds.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  inline_policy {
    name = "read-login"
    policy = jsonencode({
      Version   = "2012-10-17"
      Statement = [{ Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = aws_secretsmanager_secret.postgres_login.arn }]
    })
  }
}

resource "aws_db_proxy" "wallet" {
  name                   = "${var.project}-wallet"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.data.id]
  require_tls            = true
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.postgres_login.arn
    iam_auth    = "DISABLED"
  }
}

resource "aws_db_proxy_default_target_group" "wallet" {
  db_proxy_name = aws_db_proxy.wallet.name
  connection_pool_config {
    max_connections_percent = 90
  }
}

resource "aws_db_proxy_target" "wallet" {
  db_proxy_name         = aws_db_proxy.wallet.name
  target_group_name     = aws_db_proxy_default_target_group.wallet.name
  db_cluster_identifier = aws_rds_cluster.wallet.id
}

# ---- Redis (ElastiCache) --------------------------------------------------------------------------------------
resource "aws_elasticache_subnet_group" "main" {
  name       = var.project
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = var.project
  description                = "Pirento cache and rate limits"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.r7g.large"
  num_cache_clusters         = 3 # a primary and two replicas in other zones
  automatic_failover_enabled = true
  multi_az_enabled           = true
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.data.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  snapshot_retention_limit   = 3 # it is a cache; a restore is a convenience, not a must
}

# ---- OpenSearch (search) --------------------------------------------------------------------------------------
resource "aws_opensearch_domain" "search" {
  domain_name    = var.project
  engine_version = "OpenSearch_2.17"
  cluster_config {
    instance_type          = "r7g.large.search"
    instance_count         = 3
    zone_awareness_enabled = true
    zone_awareness_config { availability_zone_count = 3 }
  }
  ebs_options {
    ebs_enabled = true
    volume_size = 50
  }
  vpc_options {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.data.id]
  }
  encrypt_at_rest { enabled = true }
  node_to_node_encryption { enabled = true }
  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }
  # Reachable only inside the VPC, from the services' security group.
  access_policies = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { AWS = "*" }, Action = "es:ESHttp*", Resource = "arn:aws:es:${var.region}:${data.aws_caller_identity.me.account_id}:domain/${var.project}/*" }]
  })
}

data "aws_caller_identity" "me" {}

# ---- S3: lesson videos and class recordings -------------------------------------------------------------------
resource "aws_s3_bucket" "videos" {
  bucket = "${var.project}-videos-${data.aws_caller_identity.me.account_id}"
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_public_access_block" "videos" {
  bucket                  = aws_s3_bucket.videos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "videos" {
  bucket = aws_s3_bucket.videos.id
  versioning_configuration { status = "Enabled" } # a replaced or deleted video can be got back
}

resource "aws_s3_bucket_server_side_encryption_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# The browser uploads and plays with signed URLs straight from the bucket (services/learning/src/lib/video.js).
resource "aws_s3_bucket_cors_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id
  cors_rule {
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://${var.domain}", "https://www.${var.domain}"]
    allowed_headers = ["content-type"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id
  rule {
    id     = "old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 30 }
  }
}
