# The services: one image, one ECS Fargate service per Pirento service, spread over three zones. Service
# Connect gives each the same short name it has in docker compose (http://auth:4001 …). Each scales on CPU.
resource "aws_ecr_repository" "app" {
  name                 = var.project
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecs_cluster" "main" {
  name = var.project
  setting {
    name  = "containerInsights"
    value = "enhanced"
  }
  service_connect_defaults { namespace = aws_service_discovery_http_namespace.main.arn }
}

resource "aws_service_discovery_http_namespace" "main" { name = var.project }

resource "aws_cloudwatch_log_group" "app" {
  for_each          = var.services
  name              = "/${var.project}/${each.key}"
  retention_in_days = 30
}

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Starting a task: pull the image, read the secrets, write logs.
resource "aws_iam_role" "execution" {
  name               = "${var.project}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = aws_secretsmanager_secret.app.arn }]
  })
}

# What the running code may do: only the learning service touches the video bucket.
resource "aws_iam_role" "task" {
  for_each           = var.services
  name               = "${var.project}-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy" "videos" {
  role = aws_iam_role.task["learning"].id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["s3:PutObject", "s3:GetObject"], Resource = "${aws_s3_bucket.videos.arn}/*" }]
  })
}

resource "aws_iam_role_policy" "files" {
  for_each = toset(["vault", "orders", "learning"])
  role     = aws_iam_role.task[each.key].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      Resource = "${aws_s3_bucket.files.arn}/*"
    }]
  })
}

locals {
  service_urls = { for name, s in var.services : "${upper(name)}_URL" => "http://${name}:${s.port}" }
  shared_env = merge(local.service_urls, var.plain_env, {
    NODE_ENV        = "production"
    SITE_URL        = "https://${var.domain}"
    REDIS_URL       = "rediss://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
    OPENSEARCH_URL  = "https://${aws_opensearch_domain.search.endpoint}"
    VIDEO_S3_BUCKET = aws_s3_bucket.videos.bucket
    FILES_S3_BUCKET = aws_s3_bucket.files.bucket
    DATABASE_SSL    = "true"
    TRUST_PROXY     = "2" # CloudFront, then the load balancer
    MONGO_POOL      = "20"
  })
  # Every service gets the shared secrets; each Mongo service gets its own database's URI as MONGO_URI.
  secret_names = concat(local.generated, local.manual)
}

resource "aws_ecs_task_definition" "svc" {
  for_each                 = var.services
  family                   = "${var.project}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task[each.key].arn
  runtime_platform {
    cpu_architecture        = "ARM64" # Graviton: about 20% cheaper for the same work
    operating_system_family = "LINUX"
  }
  container_definitions = jsonencode([{
    name         = each.key
    image        = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
    essential    = true
    stopTimeout  = 30
    portMappings = [{ name = each.key, containerPort = each.value.port, protocol = "tcp", appProtocol = "http" }]
    environment = [for k, v in merge(local.shared_env, { SERVICE = each.key, PORT = tostring(each.value.port) }) : { name = k, value = v }]
    secrets = concat(
      [for k in local.secret_names : { name = k, valueFrom = "${aws_secretsmanager_secret.app.arn}:${k}::" }],
      contains(local.mongo_services, each.key) ? [{ name = "MONGO_URI", valueFrom = "${aws_secretsmanager_secret.app.arn}:MONGO_URI_${upper(each.key)}::" }] : [],
      each.key == "wallet" ? [{ name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.app.arn}:DATABASE_URL::" }] : [],
    )
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:${each.value.port}/health || exit 1"]
      interval    = 15
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app[each.key].name
        awslogs-region        = var.region
        awslogs-stream-prefix = each.key
      }
    }
  }])
}

resource "aws_ecs_service" "svc" {
  for_each               = var.services
  name                   = each.key
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.svc[each.key].arn
  desired_count          = each.value.min
  launch_type            = "FARGATE"
  enable_execute_command = false
  propagate_tags         = "SERVICE"
  health_check_grace_period_seconds = each.key == "gateway" ? 60 : null

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.services.id]
    assign_public_ip = false
  }

  # A bad deploy rolls itself back.
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  service_connect_configuration {
    enabled = true
    service {
      port_name = each.key
      client_alias {
        dns_name = each.key
        port     = each.value.port
      }
    }
  }

  dynamic "load_balancer" {
    for_each = each.key == "gateway" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.gateway.arn
      container_name   = "gateway"
      container_port   = 4000
    }
  }

  lifecycle { ignore_changes = [desired_count] } # auto-scaling owns it after the first apply
  depends_on = [aws_lb_listener.https]
}

resource "aws_appautoscaling_target" "svc" {
  for_each           = var.services
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.svc[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = each.value.min
  max_capacity       = each.value.max
}

resource "aws_appautoscaling_policy" "cpu" {
  for_each           = var.services
  name               = "${each.key}-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = "ecs"
  resource_id        = aws_appautoscaling_target.svc[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.svc[each.key].scalable_dimension
  target_tracking_scaling_policy_configuration {
    target_value       = 60
    scale_out_cooldown = 60  # add copies quickly when a crowd arrives
    scale_in_cooldown  = 300 # remove them slowly
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# The gateway also scales on requests per copy, which rises before CPU does when a crowd arrives.
resource "aws_appautoscaling_policy" "gateway_requests" {
  name               = "gateway-requests"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = "ecs"
  resource_id        = aws_appautoscaling_target.svc["gateway"].resource_id
  scalable_dimension = aws_appautoscaling_target.svc["gateway"].scalable_dimension
  target_tracking_scaling_policy_configuration {
    target_value       = 1500 # requests per copy per minute
    scale_out_cooldown = 60
    scale_in_cooldown  = 300
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.gateway.arn_suffix}"
    }
  }
}
