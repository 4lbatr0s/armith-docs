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
  "status": "APPROVED",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "country": "TR",
  "session": {
    "lifecycle": "approved"
  },
  "progress": {
    "idVerification": {
      "required": true,
      "completed": true,
      "approved": true
    },
    "selfieVerification": {
      "required": true,
      "completed": true,
      "approved": true
    },
    "screening": {
      "required": false,
      "completed": true,
      "approved": true
    },
    "isFullyVerified": true
  },
  "idVerification": {
    "status": "APPROVED",
    "fullName": "Ada Lovelace",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "identityNumber": "12345678901",
    "dateOfBirth": "1990-01-01",
    "expiryDate": "2030-01-01",
    "nationality": "TUR",
    "documentType": "id_card",
    "overallConfidence": 0.95,
    "confidenceScores": {...},
    "rejectionReasons": []
  },
  "selfieVerification": {
    "status": "APPROVED",
    "matchConfidence": 96,
    "spoofingRisk": 0.03,
    "livenessConfidence": 0.94,
    "faceQuality": 0.89
  },
  "screening": {
    "status": "clear",
    "provider": "opensanctions",
    "screenedAt": "2026-06-01T12:00:00Z",
    "sanctionsMatch": false,
    "pepMatch": false
  },
  "thresholds": {
    "matchConfidence": 92,
    "spoofingRiskMax": 0.25,
    "fullNameConfidence": 0.80,
    "idMinCaptureSharpness": 0.38
  },
  "images": {
    "idFront": "https://...",
    "idBack": "https://...",
    "selfie": "https://...",
    "portrait": "https://..."
  }
}
```

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

### Session Lifecycle

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