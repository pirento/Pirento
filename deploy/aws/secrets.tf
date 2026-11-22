# Secrets live in Secrets Manager and reach the services as environment variables; none is in this code.
# The encryption keys are made once and must never change: stored data (vault files, KYC media, order documents,
# resumes) cannot be read without them, so they are protected from `terraform destroy`.
locals {
  generated = ["JWT_SECRET", "INTERNAL_KEY", "VAULT_ENCRYPTION_KEY", "KYC_ENCRYPTION_KEY", "ORDERS_FILE_KEY", "LEARNING_FILE_KEY"]
  # Filled in by the owner in the console after the first apply (README.md, step 4). Leave a value empty to
  # keep that feature off.
  manual = [
    "SUPERADMIN_PASSWORD", "ANTHROPIC_API_KEY", "SMTP_URL", "SMS_WEBHOOK_TOKEN",
    "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET",
    "RAZORPAYX_KEY_ID", "RAZORPAYX_KEY_SECRET", "RAZORPAYX_ACCOUNT_NUMBER", "RAZORPAYX_WEBHOOK_SECRET",
    "DIGIO_CLIENT_ID", "DIGIO_CLIENT_SECRET", "DIGIO_WEBHOOK_SECRET",
  ]
}

resource "random_password" "generated" {
  for_each = toset(local.generated)
  length   = 48
  special  = false
  lifecycle { prevent_destroy = true }
}

resource "aws_secretsmanager_secret" "app" {
  name = "${var.project}/app"
  lifecycle { prevent_destroy = true }
}

# Generated keys, connection strings, and empty slots for the manual ones (the console edit is kept: later
# applies do not overwrite the manual values).
resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(merge(
    { for k in local.manual : k => "" },
    { for k in local.generated : k => random_password.generated[k].result },
    { for s in local.mongo_services : "MONGO_URI_${upper(s)}" => "mongodb+srv://${mongodbatlas_database_user.service[s].username}:${random_password.mongo[s].result}@${local.mongo_host}/pirento_${s}?retryWrites=true&w=majority" },
    {
      DATABASE_URL = "postgres://pirento:${random_password.postgres.result}@${aws_db_proxy.wallet.endpoint}:5432/pirento_wallet"
    },
  ))
  lifecycle { ignore_changes = [secret_string] }
}
