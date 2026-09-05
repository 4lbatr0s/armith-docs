# Limits & Quotas

| Limit | Value |
|-------|-------|
| Free tier verifications | **20 / month** → `PLAN_LIMIT_REACHED` (HTTP 429) |
| Image max size | 10 MB (`image/jpeg`, `image/png`, `image/webp`) |
| Upload URL TTL | 300 s |
| Download URL TTL | 24 h |
| Webhooks per tenant | 10 |
| IP allowlist rules | 24 CIDRs (account-wide) |
| `integrationExternalRef` | 256 chars |
| `integrationMetadata` | 20 keys, key ≤64, value ≤512, total ≤4 KB JSON |
| Session TTL (`ttlSeconds`) | 60–604800 (default 3600) |
| `X-Correlation-Id` | 128 chars |
| Idempotency TTL | 24 h |
| Sync verification | ~2–4 s per checkpoint (async has no hard timeout) |

On `429`: stop attempts, surface upgrade, resume next period. Sandbox (`ak_test_`) never consumes quota.