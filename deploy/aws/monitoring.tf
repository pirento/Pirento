# Alarms by email: errors from the site, services that keep failing their health checks, and database pressure.
resource "aws_sns_topic" "alerts" { name = "${var.project}-alerts" }

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

locals {
  alarms = {
    site-5xx = {
      namespace = "AWS/ApplicationELB"
      metric    = "HTTPCode_Target_5XX_Count"
      stat      = "Sum"
      threshold = 100
      dims      = { LoadBalancer = aws_lb.main.arn_suffix }
    }
    gateway-unhealthy = {
      namespace = "AWS/ApplicationELB"
      metric    = "UnHealthyHostCount"
      stat      = "Maximum"
      threshold = 1
      dims      = { LoadBalancer = aws_lb.main.arn_suffix, TargetGroup = aws_lb_target_group.gateway.arn_suffix }
    }
    slow-responses = {
      namespace = "AWS/ApplicationELB"
      metric    = "TargetResponseTime"
      stat      = "Average"
      threshold = 1.5
      dims      = { LoadBalancer = aws_lb.main.arn_suffix }
    }
    wallet-db-cpu = {
      namespace = "AWS/RDS"
      metric    = "CPUUtilization"
      stat      = "Average"
      threshold = 75
      dims      = { DBClusterIdentifier = aws_rds_cluster.wallet.id }
    }
    redis-cpu = {
      namespace = "AWS/ElastiCache"
      metric    = "EngineCPUUtilization"
      stat      = "Average"
      threshold = 75
      dims      = { ReplicationGroupId = aws_elasticache_replication_group.redis.id }
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "alarm" {
  for_each            = local.alarms
  alarm_name          = "${var.project}-${each.key}"
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  statistic           = each.value.stat
  dimensions          = each.value.dims
  period              = 60
  evaluation_periods  = 5
  threshold           = each.value.threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}
