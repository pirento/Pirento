# Backups beyond each store's own: AWS Backup copies the wallet database and the video bucket every day and keeps
# a second copy in Hyderabad (ap-south-2), so even losing the Mumbai region loses no money record or video.
# Mongo's backups are Atlas's (data.tf: snapshots plus point-in-time restore).
resource "aws_backup_vault" "main" {
  name = var.project
}

provider "aws" {
  alias  = "dr"
  region = "ap-south-2"
}

resource "aws_backup_vault" "dr" {
  provider = aws.dr
  name     = "${var.project}-dr"
}

resource "aws_backup_plan" "main" {
  name = var.project
  rule {
    rule_name         = "daily"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(30 21 * * ? *)" # 03:00 India time
    lifecycle { delete_after = 90 }
    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle { delete_after = 90 }
    }
  }
}

resource "aws_iam_role" "backup" {
  name = "${var.project}-backup"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "backup.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  for_each = toset([
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
    "arn:aws:iam::aws:policy/AWSBackupServiceRolePolicyForS3Backup",
    "arn:aws:iam::aws:policy/AWSBackupServiceRolePolicyForS3Restore",
  ])
  role       = aws_iam_role.backup.name
  policy_arn = each.value
}

resource "aws_backup_selection" "main" {
  name         = var.project
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn
  resources    = [aws_rds_cluster.wallet.arn, aws_s3_bucket.videos.arn]
}
