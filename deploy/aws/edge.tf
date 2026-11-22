# The way in: people → CloudFront (edge cache in India and worldwide, TLS, WAF) → the load balancer → gateways.
# Built web files are cached at the edge for a year (hashed names); /api is never cached.
data "aws_route53_zone" "site" { name = var.domain }

resource "aws_security_group" "alb" {
  name   = "${var.project}-alb"
  vpc_id = module.vpc.vpc_id
  ingress {
    description     = "only CloudFront reaches the load balancer"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ec2_managed_prefix_list" "cloudfront" { name = "com.amazonaws.global.cloudfront.origin-facing" }

# Certificates: one in Mumbai for the load balancer (origin.<domain>), one in us-east-1 for CloudFront.
resource "aws_acm_certificate" "origin" {
  domain_name       = "origin.${var.domain}"
  validation_method = "DNS"
}

resource "aws_acm_certificate" "edge" {
  provider                  = aws.us_east_1
  domain_name               = var.domain
  subject_alternative_names = ["*.${var.domain}"]
  validation_method         = "DNS"
}

locals {
  cert_records = merge(
    { for o in aws_acm_certificate.origin.domain_validation_options : o.domain_name => o },
    { for o in aws_acm_certificate.edge.domain_validation_options : o.domain_name => o },
  )
}

resource "aws_route53_record" "cert" {
  for_each        = local.cert_records
  zone_id         = data.aws_route53_zone.site.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "origin" {
  certificate_arn         = aws_acm_certificate.origin.arn
  validation_record_fqdns = [for k, r in aws_route53_record.cert : r.fqdn if k == "origin.${var.domain}"]
}

resource "aws_acm_certificate_validation" "edge" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.edge.arn
  validation_record_fqdns = [for k, r in aws_route53_record.cert : r.fqdn if k != "origin.${var.domain}"]
}

resource "aws_lb" "main" {
  name               = var.project
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]
  idle_timeout       = 60 # the services keep connections alive for 65 s, longer than this
  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "gateway" {
  name                 = "${var.project}-gateway"
  port                 = 4000
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = module.vpc.vpc_id
  deregistration_delay = 30 # matches the services' 25 s drain on SIGTERM
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 10
  }
}

# Requests must carry the secret header CloudFront adds, so nobody skips the CDN and the WAF.
resource "random_password" "origin_header" {
  length  = 40
  special = false
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.origin.certificate_arn
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "from_cloudfront" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1
  condition {
    http_header {
      http_header_name = "x-origin-key"
      values           = [random_password.origin_header.result]
    }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }
}

resource "aws_route53_record" "origin" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = "origin.${var.domain}"
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# WAF at the edge: AWS's common and bad-input rules, plus a per-IP rate cap in front of the app's own limits.
resource "aws_wafv2_web_acl" "edge" {
  provider = aws.us_east_1
  name     = var.project
  scope    = "CLOUDFRONT"
  default_action {
    allow {}
  }
  rule {
    name     = "rate-per-ip"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 3000 # requests per IP per 5 minutes; offices and colleges share IPs, so not lower
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-per-ip"
      sampled_requests_enabled   = true
    }
  }
  dynamic "rule" {
    for_each = { AWSManagedRulesCommonRuleSet = 2, AWSManagedRulesKnownBadInputsRuleSet = 3, AWSManagedRulesAmazonIpReputationList = 4 }
    content {
      name     = rule.key
      priority = rule.value
      override_action {
        none {}
      }
      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
          # Uploads (resumes, order documents, KYC) are bigger than the common set's 8 KB body rule allows.
          dynamic "rule_action_override" {
            for_each = rule.key == "AWSManagedRulesCommonRuleSet" ? ["SizeRestrictions_BODY"] : []
            content {
              name = rule_action_override.value
              action_to_use {
                count {}
              }
            }
          }
        }
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.key
        sampled_requests_enabled   = true
      }
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = var.project
    sampled_requests_enabled   = true
  }
}

data "aws_cloudfront_cache_policy" "optimized" { name = "Managed-CachingOptimized" }
data "aws_cloudfront_cache_policy" "disabled" { name = "Managed-CachingDisabled" }
data "aws_cloudfront_origin_request_policy" "all_viewer" { name = "Managed-AllViewerExceptHostHeader" }

resource "aws_cloudfront_distribution" "site" {
  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2and3"
  aliases         = [var.domain, "www.${var.domain}"]
  price_class     = "PriceClass_200" # includes India
  web_acl_id      = aws_wafv2_web_acl.edge.arn

  origin {
    origin_id   = "gateway"
    domain_name = "origin.${var.domain}"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 60
    }
    custom_header {
      name  = "x-origin-key"
      value = random_password.origin_header.result
    }
  }

  # Pages and the API: never cached, everything forwarded (cookies for the session, headers for auth).
  default_cache_behavior {
    target_origin_id         = "gateway"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
    compress                 = true
  }

  # Built files: hashed names, cached at the edge, compressed.
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    target_origin_id       = "gateway"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    compress               = true
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.edge.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_route53_record" "site" {
  for_each = toset([var.domain, "www.${var.domain}"])
  zone_id  = data.aws_route53_zone.site.zone_id
  name     = each.value
  type     = "A"
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
