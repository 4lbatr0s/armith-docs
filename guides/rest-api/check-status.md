# Check Status — REST API

Polling `GET /kyc/status/:profileId` for verification progress and final result.

---

## Endpoint

```
GET https://armith-backend-live.onrender.com/kyc/status/:profileId
```

> Alias: `GET /kyc/sessions/:profileId` (same handler)

---

## Required Headers

| Header | Value |
|--------|-------|
| `x-api-key` | `ak_live_...` or `ak_test_...` |

---

## Response

```json
{
  "id": "672a9c2e3f1b2c4d5e6f7890",
  "status": "APPROVED",
  "country": "TR",
  "createdAt": "2026-06-01T11:58:12.000Z",
  "rejectionReasons": [],
  "workflowId": null,
  "packs": [],
  "verificationRules": { "requireIdCard": true, "requireSelfie": true, "requireAml": false, "requireVideocall": false },
  "session": {
    "id": "672a9c2e3f1b2c4d5e6f7890",
    "lifecycle": { "phase": "approved", "terminal": true },
    "correlationId": "5b0c2f0e-..."
  },
  "progress": {
    "idVerification": { "required": true, "completed": true, "approved": true },
    "selfieVerification": { "required": true, "completed": true, "approved": true },
    "isFullyVerified": true
  },
  "idVerification": {
    "status": "APPROVED",
    "data": {
      "fullName": "Ada Lovelace",
      "firstName": "Ada",
      "lastName": "Lovelace",
      "identityNumber": "12345678901",
      "dateOfBirth": "1990-01-01",
      "expiryDate": "2030-01-01",
      "nationality": "TUR",
      "readabilityIssues": []
    },
    "confidence": { "overallConfidence": 0.95, "imageQuality": 0.9, "tamperingRisk": 0.02 },
    "confidenceScores": [...],
    "rejectionReasons": [],
    "errors": []
  },
  "selfieVerification": {
    "status": "APPROVED",
    "data": {
      "isMatch": true,
      "matchConfidence": 96,
      "spoofingRisk": 0.03,
      "livenessConfidence": 0.94,
      "imageQuality": 0.89
    },
    "confidenceScores": [...],
    "rejectionReasons": [],
    "errors": []
  },
  "screening": null,
  "videocall": {
    "enabled": false,
    "requiresKycApproved": true,
    "status": null,
    "completed": false,
    "approved": false,
    "sessionId": null
  },
  "images": {
    "idFront": "https://...",
    "idBack": "https://...",
    "selfie": "https://..."
  }
}
```

> `screening` is `null` unless AML is required; when present it carries `status`, `provider`, `screenedAt`, `sanctionsMatch`, `pepMatch`, `skipped`, `reason` and `hits[]`. It is **not** part of `progress`: while AML is `pending` (or `unavailable`/`misconfigured`), `isFullyVerified` stays `false`. `evidence` and `thresholds` (your pass/fail bars) are only returned to API-key callers, never to end-user capture sessions.

---

## Field Reference

### Top-Level Status

| Value | Meaning |
|-------|---------|
| `APPROVED` | All required checkpoints passed |
| `PENDING` | Awaiting next required step (usually selfie) |
| `REJECTED` | Validation failed |
| `FAILED` | System error |
| `UNDER_REVIEW` | Manual review queue |

### Session Lifecycle (`session.lifecycle.phase`; `session.lifecycle.terminal` is `true` once no further polling is useful)

| Value | Meaning |
|-------|---------|
| `awaiting_id` | Waiting for ID verification |
| `awaiting_selfie` | ID passed; waiting for selfie |
| `awaiting_screening` | Verification done; AML screening in progress |
| `approved` | All checks passed |
| `rejected` | Terminal rejection |
| `failed` | System failure |
| `under_review` | In manual review queue |

### Progress Object

Each step has:
| Field | Description |
|-------|-------------|
| `required` | Boolean — is this step required by config |
| `completed` | Boolean — has step been attempted |
| `approved` | Boolean — did step pass |

### Checkpoint Detail Objects

**ID Verification** — extracted data, confidence scores, rejection reasons
**Selfie Verification** — match confidence, spoofing risk, liveness, quality
**eID NFC Verification** — chip auth, SOD validity, data match, combined score
**Screening** — status, provider, matches, hits
**Video Ident** — sibling `videocall` + `videocallVerification` (does not affect `progress.isFullyVerified` or KYC `status`)

### Thresholds Snapshot

Flat key-value of thresholds used for this verification — useful for debugging.

### Images

Stored download URLs for all uploaded images.

---

## Polling Strategy

### Recommended: Exponential Backoff

```python
import time
import requests

def poll_status(profile_id, api_key, max_attempts=30):
    url = f"https://armith-backend-live.onrender.com/kyc/status/{profile_id}"
    headers = {"x-api-key": api_key}
    
    for attempt in range(max_attempts):
        resp = requests.get(url, headers=headers)
        data = resp.json()
        
        if data["status"] in ("APPROVED", "REJECTED", "FAILED", "UNDER_REVIEW"):
            return data
        
        # Still processing
        wait = min(2 ** attempt, 30)  # 1, 2, 4, 8, 16, 30, 30...
        time.sleep(wait)
    
    raise TimeoutError("Status polling timed out")
```

### Sync Verification (Default)
- ID check: ~2-4 seconds
- Selfie check: ~2-4 seconds
- Total: ~4-8 seconds for both

### Async Verification
- Returns `202 Accepted` immediately
- Poll every 2-5 seconds
- Typical: 5-30 seconds depending on queue

---

## When to Stop Polling

| Status | Action |
|--------|--------|
| `APPROVED` | Success — unlock features |
| `REJECTED` | Show rejection reasons, allow retry |
| `FAILED` | Retry with backoff + idempotency key |
| `UNDER_REVIEW` | Switch to webhook or poll less frequently (30s) |
| `PENDING` + `awaiting_selfie` | Prompt user for selfie |

---

## Webhook Alternative

**Don't poll in production.** Use webhooks for real-time delivery:

1. Configure webhook in **Integrations → Webhooks**
2. Subscribe to `verification.completed` and `verification.failed`
3. Receive POST on terminal events instantly

See [Webhooks Guide](/guides/webhooks/get-started)

---

## What's Next?

- [Handle Results](/guides/rest-api/handle-results) — user messages per outcome
- [Webhooks](/guides/webhooks/get-started) — real-time instead of polling
- [Errors & Statuses](/reference/status-codes) — full error code reference