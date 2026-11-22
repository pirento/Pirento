# Pirento on AWS

Everything runs in Mumbai (ap-south-1), with backups copied to Hyderabad (ap-south-2):

```
people ─► CloudFront (CDN, TLS, WAF) ─► load balancer ─► gateway ×N ─► auth · wallet · catalog · orders ·
                                                                     identity · learning · vault · support · ai
                                                                     (each ×N, ECS Fargate, 3 zones)
data:  MongoDB Atlas (one database + one user per service, PITR backups)
       Aurora PostgreSQL via RDS Proxy (the wallet)   ElastiCache Redis (cache, rate limits)
       OpenSearch (search)   S3 (videos, signed URLs)   Secrets Manager (keys)   AWS Backup (daily, 2 regions)
```

Not yet run against a real account: `terraform validate` and `plan` are the first things to do, and any error
they show must be fixed before `apply`.

## Steps

1. **State bucket** (once): make an S3 bucket and a DynamoDB table (key `LockID`) for Terraform's state, then
   `terraform init -backend-config="bucket=<bucket>" -backend-config="key=pirento.tfstate" -backend-config="region=ap-south-1" -backend-config="dynamodb_table=<table>"`.
2. **Variables:** copy `terraform.tfvars.example` to `terraform.tfvars`, fill it in. Export
   `MONGODB_ATLAS_PUBLIC_KEY` and `MONGODB_ATLAS_PRIVATE_KEY` (an Atlas organisation API key). The domain's
   Route 53 hosted zone must exist.
3. **Image:** `terraform apply -target=aws_ecr_repository.app`, then build for Graviton and push:
   `docker buildx build --platform linux/arm64 -t <ecr>:<tag> --push .` (log in with
   `aws ecr get-login-password | docker login --username AWS --password-stdin <ecr>`). Set `image_tag` to it.
4. **Everything:** `terraform plan`, read it, `terraform apply`. Then open the `pirento/app` secret in Secrets
   Manager and fill the empty values (SUPERADMIN_PASSWORD, ANTHROPIC_API_KEY, SMTP_URL, Razorpay, RazorpayX,
   Digio …). Restart the services (`aws ecs update-service --force-new-deployment`) to pick them up.
5. **Moving from docker compose:** copy each Mongo database with `mongodump`/`mongorestore` into Atlas, and the
   wallet with `services/wallet/scripts/migrate-from-mongo.mjs` (or `pg_dump` if it is already PostgreSQL).
   Keep the old encryption keys: put the old `VAULT_ENCRYPTION_KEY`, `KYC_ENCRYPTION_KEY`, `ORDERS_FILE_KEY`,
   `LEARNING_FILE_KEY`, `JWT_SECRET` and `INTERNAL_KEY` into the secret instead of the generated ones, or the
   stored files cannot be read.
6. **Deploys:** push a new tag, set `image_tag`, `terraform apply`. ECS replaces copies one zone at a time and
   rolls back by itself if the new ones fail their health checks.

## Before launch

- Run the load test (`scripts/load/k6.js`, see docs/SCALING.md) against this stack, not against production.
- Restore a backup once (Atlas point-in-time, and an Aurora snapshot into a new cluster) so the steps are known.
- Confirm the alarm email (AWS sends a link to `alert_email`).
