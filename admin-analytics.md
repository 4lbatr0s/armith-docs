# Admin Analytics

Armith provides operational analytics endpoints for monitoring verification performance, trends, and webhook delivery health.

## Dashboard Stats

A quick overview of your tenant's verification activity:

```bash
curl -X GET "https://armith-backend-live.onrender.com/admin/stats" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Response

```json
{
  "totalVerifications": 1250,
  "approvedCount": 980,
  "rejectedCount": 180,
  "pendingCount": 45,
  "underReviewCount": 25,
  "failedCount": 20,
  "approvalRate": 78.4,
  "activeApiKeys": 3,
  "webhookSuccessRate": 99.2,
  "topCountries": [
    { "country": "TR", "count": 850 },
    { "country": "US", "count": 200 },
    { "country": "GB", "count": 150 }
  ]
}
```

| Field | Description |
|-------|-------------|
| `totalVerifications` | Total profiles created |
| `approvedCount` | Profiles with `APPROVED` status |
| `rejectedCount` | Profiles with `REJECTED` status |
| `pendingCount` | Profiles awaiting next step |
| `underReviewCount` | Profiles in manual review |
| `failedCount` | System failures |
| `approvalRate` | Percentage approved |
| `activeApiKeys` | Non-revoked API keys |
| `webhookSuccessRate` | Webhook delivery success percentage |
| `topCountries` | Top 5 countries by volume |

## Account Usage

View plan-level usage details:

```bash
curl -X GET "https://armith-backend-live.onrender.com/admin/account/usage" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Response

```json
{
  "planTier": "growth",
  "monthlyVerificationLimit": 500,
  "currentPeriodCount": 342,
  "remaining": 158,
  "burstLimit": 100,
  "activeApiKeys": 3,
  "features": {
    "perKeyIpAllowlist": true,
    "customBranding": true,
    "prioritySupport": false
  }
}
```

## Detailed Analytics

For deeper operational insights:

```bash
curl -X GET "https://armith-backend-live.onrender.com/admin/analytics" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Response

```json
{
  "statusBreakdown": {
    "APPROVED": 980,
    "REJECTED": 180,
    "PENDING": 45,
    "UNDER_REVIEW": 25,
    "FAILED": 20
  },
  "funnel": {
    "totalProfiles": 1250,
    "idVerificationDone": 1180,
    "selfieVerificationDone": 1050,
    "approved": 980
  },
  "webhookStats": {
    "last30Days": {
      "total": 1500,
      "delivered": 1488,
      "failed": 12,
      "successRate": 99.2
    },
    "last90Days": {
      "total": 4200,
      "delivered": 4160,
      "failed": 40,
      "successRate": 99.0
    }
  },
  "period": {
    "start": "2026-03-01T00:00:00Z",
    "end": "2026-06-01T00:00:00Z"
  }
}
```

### Analytics Sections

| Section | Description |
|---------|-------------|
| `statusBreakdown` | Count of profiles in each status |
| `funnel` | Drop-off analysis across verification steps |
| `webhookStats` | Webhook delivery reliability (30/90 day windows) |

## Error Summary

Identify top failure modes across your profiles:

```bash
curl -X GET "https://armith-backend-live.onrender.com/admin/errors/summary?limit=100" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Response

```json
{
  "errors": [
    {
      "textCode": "BLURRY_IMAGE",
      "count": 85,
      "lastOccurrence": "2026-06-01T10:00:00Z"
    },
    {
      "textCode": "LOW_MATCH_CONFIDENCE",
      "count": 42,
      "lastOccurrence": "2026-06-01T09:30:00Z"
    },
    {
      "textCode": "GROQ_API_ERROR",
      "count": 12,
      "lastOccurrence": "2026-06-01T08:00:00Z"
    }
  ]
}
```

Maximum limit: 400 error fingerprints.

## SLO Status

Service-level objective dashboard:

```bash
curl -X GET "https://armith-backend-live.onrender.com/ops/slo" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

Returns operational status metrics for internal monitoring.

## Prometheus Metrics

For advanced observability (when `METRICS_ENABLED=1`):

```bash
curl -X GET "https://armith-backend-live.onrender.com/metrics"
```

Returns Prometheus-formatted metrics for scraping.

## Using Analytics

### Identify bottlenecks

If the funnel shows significant drop-off between ID and selfie, check:

- Selfie capture UX quality
- Selfie threshold strictness (`matchConfidence`, `spoofingRiskMax`)
- Lighting/face coverage guidance for users

### Monitor webhook health

- If `webhookSuccessRate` drops below 99%, investigate delivery failures
- Check if your endpoint is reachable and responding within timeout
- Use the webhook delivery log to identify failing endpoints

### Track error trends

- Rising `BLURRY_IMAGE` counts → improve capture guidance
- Rising `GROQ_API_ERROR` → check LLM provider status
- Rising `SPOOFING_DETECTED` → review fraud patterns

## Best Practices

1. **Monitor analytics weekly** — track approval rates and error trends
2. **Set up alerts** on webhook success rate drops
3. **Compare funnel metrics** week-over-week to measure UX improvements
4. **Use error summary** to prioritize product fixes
5. **Export analytics** periodically for compliance reporting
