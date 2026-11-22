output "ecr_repository" {
  description = "Push the image here (README.md, step 3)."
  value       = aws_ecr_repository.app.repository_url
}

output "app_secret" {
  description = "Fill the empty values here in the Secrets Manager console (README.md, step 4)."
  value       = aws_secretsmanager_secret.app.name
}

output "site" { value = "https://${var.domain}" }
output "cloudfront_domain" { value = aws_cloudfront_distribution.site.domain_name }
output "video_bucket" { value = aws_s3_bucket.videos.bucket }
