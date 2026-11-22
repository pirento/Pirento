# Scaling Pirento

The goal: stay fast with 8–10 lakh people on the site at once. Nothing here is proven until the load test below
has been run against the AWS stack; treat every number as a starting point to measure, not a promise.

## What "10 lakh at once" means

People read before they click. If each of 10 lakh people makes one request every 10 seconds, that is about
**1 lakh requests per second** at the peak. Most of those are page files and the same few public reads.

| Layer                                                                          | How it carries the load                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Page files (JS, CSS, fonts, images)                                            | CloudFront serves them from the edge with year-long caching; they barely reach our servers.            |
| Public reads every page makes (settings, prices, tracks, programmes, openings) | Redis cache, shared by every copy, forgotten on any edit.                                              |
| Gateway                                                                        | Stateless; scales on CPU and on requests per copy (`deploy/aws/ecs.tf`), 4 to 200 copies over 3 zones. |
| Services                                                                       | Stateless; each scales on CPU between its own floor and ceiling.                                       |
| Rate limits                                                                    | In Redis, so all gateways count one IP together; WAF caps a single IP at the edge first.               |
| Mongo (Atlas)                                                                  | One replica set over 3 zones with compute auto-scaling; one database per service.                      |
| Wallet (Aurora PostgreSQL)                                                     | Serverless v2 scales 2–64 ACU; RDS Proxy pools connections for many wallet copies.                     |
| Search                                                                         | OpenSearch, 3 nodes over 3 zones.                                                                      |
| Videos                                                                         | Straight from S3 with signed URLs; never through our servers.                                          |

## Limits that are not ours to raise

- **Sign-in codes:** SMS and email providers have their own rates. A launch-day rush of new sign-ups is capped
  by them, not by our servers; ask the providers for a higher rate before launch.
- **Digio, Razorpay, Anthropic:** each has per-account rate limits. Ask for higher limits before launch.
- **AWS account quotas:** Fargate tasks per region, ALB targets and NAT bandwidth have default limits; raise them
  in Service Quotas before a big launch.

## When one database is too big

Atlas auto-scales its tier up to `M80` (`data.tf`). Past that, shard the busiest database (`cluster_type =
"SHARDED"` and a shard key, e.g. `userId` for orders and tickets). Every query that filters by `userId` stays on
one shard. Measure in Atlas's Performance Advisor first; add indexes before adding shards.

## Load test

`scripts/load/k6.js` ramps up a crowd reading the home page and the public API. Run it from several machines or
k6 Cloud against a **test copy** of the stack: from one IP the app's own limits (300 requests a minute per IP)
and the WAF will block it, so set `RATE_LIMIT_PER_MIN` high on the test copy only.

Raise `TARGET` in steps (1k, 10k, 50k virtual users). At each step note the p95 latency, the error rate, how many
copies each service scaled to, and Atlas/Aurora/Redis CPU. The first thing to saturate is the next thing to fix.

## Backups and recovery

| Store             | Backup                                                                                  | Restore                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Mongo (Atlas)     | Continuous, point-in-time for 7 days; daily 30 days, weekly 12 weeks, monthly 12 months | Atlas UI: restore to a time, into a new cluster, then switch `MONGO_URI` |
| Wallet (Aurora)   | Point-in-time for 35 days; AWS Backup daily for 90 days, copied to Hyderabad            | New cluster from a snapshot or a time; point RDS Proxy at it             |
| Videos (S3)       | Versioning (30 days of old versions); AWS Backup daily, copied to Hyderabad             | Restore the object version, or the backup                                |
| Redis, OpenSearch | Rebuilt from the databases; nothing is lost if they are                                 | Redis fills itself; re-save lessons and openings to re-index             |

Practise one restore of each before launch.
