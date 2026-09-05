# Handle Results — REST API

User-facing messages and retry logic for each verification outcome.

---

## Outcome Matrix

| Profile Status | Lifecycle | User Message | Your Action |
|----------------|-----------|--------------|-------------|
| `APPROVED` | `approved` | "Verification successful!" | Unlock gated features |
| `PENDING` | `awaiting_selfie` | "Please take a selfie to complete verification" | Prompt for selfie |
| `PENDING` | `awaiting_id` | "Please upload your ID document" | Prompt for ID upload |
| `REJECTED` | `rejected` | See rejection reasons below | Show reasons, allow retry |
| `UNDER_REVIEW` | `under_review` | "Under review — we'll notify you" | Wait for webhook or poll |
| `FAILED` | `failed` | "Technical error — please try again" | Retry with backoff |

---

## Rejection Reasons & User Messages

### ID Check Rejections

| Code | User Message | Remediation |
|------|--------------|-------------|
| `BLURRY_IMAGE` | "Photo is too blurry. Please retake with steady hands and good lighting." | Retake photo |
| `ADVERSARIAL_IMAGE_DETECTED` | "Invalid image detected. Please upload a genuine photo." | Do not retry same file |
| `EXPIRED_ID` | "Your ID has expired. Please use a valid document." | Use valid ID |
| `INVALID_IDENTITY_NUMBER` | "ID number appears invalid. Please check and retry." | Re-enter/upload |
| `MISSING_IDENTITY_NUMBER` | "Could not read ID number. Please retake photo clearly." | Retake photo |
| `INVALID_AGE` | "Age does not meet requirements." | Check age policy |
| `LOW_DOCUMENT_VITALITY` | "Document appears to be a copy/screen. Please use original." | Use physical document |
| `HIGH_TAMPERING_RISK` | "Document shows signs of alteration." | Manual review |
| `MRZ_MISMATCH` | "Machine-readable zone doesn't match visual data." | Retake or manual |

### Selfie Check Rejections

| Code | User Message | Remediation |
|------|--------------|-------------|
| `LOW_MATCH_CONFIDENCE` | "Selfie doesn't match your ID photo. Please retake." | Retake selfie |
| `SPOOFING_DETECTED` | "Please use a live camera — no screens, photos, or prints." | Live selfie only |
| `NO_FACE_DETECTED` | "No face found. Center your face in the frame." | Reposition |
| `POOR_SELFIE_QUALITY` | "Selfie is blurry/dark. Use good lighting and hold steady." | Retake |
| `FACE_COVERAGE_LOW` | "Move closer so your face fills the frame." | Move closer |
| `MULTIPLE_FACES` | "Only one face allowed. Remove others from frame." | Solo selfie |
| `LIVENESS_FAILED` | "Please blink and move naturally during capture." | Retake with motion |

### System Errors (Retryable)

| Code | User Message | Your Action |
|------|--------------|-------------|
| `GROQ_API_ERROR` | "Service temporarily unavailable. Please try again." | Retry with backoff |
| `INTERNAL_ERROR` | "Something went wrong. Please try again." | Retry with backoff |
| `INVALID_IMAGE_URL` | "Image link expired. Please re-upload." | Re-upload images |

---

## Retry Logic

### Preflight Failures (3xxx)
**Do NOT retry same image.**
- `BLURRY_IMAGE`, `ADVERSARIAL_IMAGE_DETECTED`, `NO_FACE_DETECTED`
- Ask user to retake photo

### Business Rejections (1xxx, 2xxx, 4xxx, 7xxx, 8xxx)
**Allow user to retry with new images.**
- Show specific reason
- Let user upload new ID/selfie
- Use new `Idempotency-Key`

### System Errors (5xxx)
**Retry automatically with exponential backoff.**
- `GROQ_API_ERROR`, `INTERNAL_ERROR`
- Use same `Idempotency-Key` (cached response returned)
- Max 3 retries, then escalate

### Flow Errors (6xxx)
| Code | Fix |
|------|-----|
| `PROFILE_ID_REQUIRED` | Run `id-check` first |
| `UNSUPPORTED_COUNTRY` | Check `GET /kyc/countries` |
| `IMAGE_TOO_LARGE` | Compress before upload |

---

## Implementation Example

```javascript
async function handleVerificationResult(profileId, apiKey) {
  const status = await pollStatus(profileId, apiKey);
  
  switch (status.status) {
    case 'APPROVED':
      return { success: true, message: 'Verified! Welcome.' };
    
    case 'PENDING':
      if (status.session.lifecycle === 'awaiting_selfie') {
        return { 
          success: false, 
          action: 'selfie_required',
          message: 'Please complete the selfie step.' 
        };
      }
      break;
    
    case 'REJECTED':
      const reasons = status.idVerification?.rejectionReasons 
        || status.selfieVerification?.rejectionReasons 
        || [];
      
      const messages = reasons.map(r => REJECTION_MESSAGES[r] || 'Verification failed');
      return { 
        success: false, 
        action: 'retry',
        message: messages.join('. '),
        codes: reasons 
      };
    
    case 'UNDER_REVIEW':
      return { 
        success: false, 
        action: 'wait',
        message: 'Your verification is under review. We\'ll notify you shortly.' 
      };
    
    case 'FAILED':
      return { 
        success: false, 
        action: 'retry',
        message: 'Technical error. Please try again in a moment.' 
      };
  }
}

const REJECTION_MESSAGES = {
  'BLURRY_IMAGE': 'Photo is too blurry. Please retake with steady hands.',
  'EXPIRED_ID': 'Your ID has expired. Please use a valid document.',
  'LOW_MATCH_CONFIDENCE': 'Selfie doesn\'t match your ID. Please retake.',
  'SPOOFING_DETECTED': 'Please use a live camera — no screens or photos.',
  'NO_FACE_DETECTED': 'No face found. Center your face in the frame.',
  // ... add all codes
};
```

---

## Idempotency on Retry

```javascript
// Same operation, same key = cached response (no double charge)
const idempotencyKey = `id-check-${orderId}-${attemptNumber}`;

const response = await fetch('/kyc/id-check', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey
  },
  body: JSON.stringify(payload)
});

if (response.headers.get('Idempotent-Replayed') === 'true') {
  console.log('Returned cached result — no duplicate processing');
}
```

---

## Plan Limit Handling

| Tier | Monthly Limit | On Limit |
|------|---------------|----------|
| Free | 20 | `PLAN_LIMIT_REACHED` (429) |
| Growth | 1,000 | Upgrade or wait |
| Enterprise | Custom | Contact sales |

```javascript
if (response.status === 429) {
  // Show upgrade prompt, disable verification until reset
  showUpgradeModal();
}
```

---

## What's Next?

- [Webhooks](/guides/webhooks/get-started) — real-time results (recommended over polling)
- [Errors Reference](/reference/status-codes) — complete error code list
- [Sandbox Testing](/reference/sandbox-testing) — test all scenarios
- [Threshold Tuning](/advanced/threshold-tuning) — adjust rejection sensitivity