# Screening (AML / Sanctions / PEP)

Armith provides optional **AML (Anti-Money Laundering) screening** as a post-verification step. When configured, the system screens extracted identity data against sanctions lists, politically exposed persons (PEP) databases, and adverse media sources.

## Screening Providers

| Provider | Coverage | Type | Status |
|----------|----------|------|--------|
| **OpenSanctions** | Global sanctions + PEP | Open source | Active (default) |
| **ComplyAdvantage** | Sanctions + PEP + adverse media | Commercial | Configurable |
| **Diligence** | Screener | Commercial | Configurable |

Configure the provider via `PATCH /config`:

```json
{
  "adapters": {
    "screening": "opensanctions"
  }
}
```

## How Screening Works

1. **ID verification completes** — identity data extracted (full name, DOB, nationality)
2. **Screening triggers** — if `requireAml` is enabled in tenant config
3. **Data is sent** to the configured screening provider
4. **Results are persisted** on the `Profile` document:
   - `screening.status` — `pending`, `clear`, `sanctions`, `pep`, `skipped`, `misconfigured`
   - `screening.sanctionsMatch` — boolean
   - `screening.pepMatch` — boolean
   - `screening.hits` — array of match details
5. **Profile status updates** based on screening outcome

## Configuration

### Enable screening

```bash
curl -X PATCH "https://armith-backend-live.onrender.com/config" \
  -H "Authorization: Bearer <CLERK_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationSteps": {
      "requireAml": true
    },
    "adapters": {
      "screening": "opensanctions"
    }
  }'
```

### Verification steps

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `requireAml` | boolean | `false` | Enable AML screening as a verification step |
| `adapters.screening` | enum | — | Screening provider selection |

## Screening Results

The screening result is available on the profile status endpoint:

```bash
curl -X GET "https://armith-backend-live.onrender.com/kyc/status/<PROFILE_ID>" \
  -H "x-api-key: ak_live_<YOUR_KEY>"
```

Response includes:

```json
{
  "status": "APPROVED",
  "screening": {
    "status": "clear",
    "provider": "opensanctions",
    "screenedAt": "2026-06-01T12:00:00Z",
    "sanctionsMatch": false,
    "pepMatch": false
  }
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Screening not yet performed |
| `clear` | No sanctions or PEP matches found |
| `sanctions` | Sanctions match detected |
| `pep` | PEP match detected (non-sanctions) |
| `skipped` | Screening skipped (config or error) |
| `misconfigured` | Screening provider not configured properly |

## Impact on Verification Status

| Screening Result | Profile Status Impact |
|-----------------|----------------------|
| `clear` | No impact — proceeds to next step or approval |
| `sanctions` | Profile may be `REJECTED` or `UNDER_REVIEW` depending on policy |
| `pep` | Profile may be `UNDER_REVIEW` for manual assessment |
| `misconfigured` | Profile may proceed with warning, depending on tenant config |

## Hit Details

When matches are found, `screening.hits` contains:

```json
{
  "hits": [
    {
      "list": "eu_sanctions",
      "name": "ENTITY NAME",
      "matchType": "full_name",
      "confidence": 0.85,
      "details": {
        "source": "https://opensanctions.org/...",
        "program": "EU Consolidated Sanctions"
      }
    }
  ]
}
```

## Provider Configuration

### OpenSanctions (Default)

- Open source sanctions + PEP data
- No additional API key required
- Updated regularly via the OpenSanctions dataset
- Covers: EU sanctions, UN sanctions, OFAC, UK sanctions, PEP lists

### ComplyAdvantage

- Commercial provider
- Requires `COMPLYADVANTAGE_API_KEY` environment variable
- Real-time screening with adverse media coverage
- Configure via `adapters.screening: "complyadvantage"`

### Diligence

- Commercial provider
- Configure via `adapters.screening: "dilisense"` or `"diligence"` (alias)
- Regional coverage options

## Best Practices

1. **Enable screening for production** — especially for financial use cases
2. **Review matches manually** — automated screening is a first pass, not a final decision
3. **Configure webhooks** for `verification.manual_review_queued` when screening flags profiles
4. **Log screening hits** for audit and compliance reporting
5. **Test screening behavior** in sandbox before enabling in production
