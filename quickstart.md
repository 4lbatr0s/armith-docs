# Quickstart — Get Verified in 5 Minutes

Choose your integration path and follow the steps. Each path takes ~5 minutes.

---

## Option A: Direct REST API (Backend-to-Backend)

**Best for:** Custom frontends, server-side flows, any language

### Prerequisites
- Armith account with dashboard access
- API key from **Integrations → API Keys** (select "Live" for production, "Sandbox" for testing)
- Backend server that can send HTTP requests

### 5-Step Flow

```bash
# 1. Health check
curl -sS "https://armith-backend-live.onrender.com/health"

# 2. Get upload URL for ID front
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileType": "image/jpeg", "documentType": "id-front"}'
# Save the "downloadUrl" from response

# 3. Upload your ID image to the uploadUrl
curl -X PUT "UPLOAD_URL_FROM_STEP_2" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@./id-front.jpg"

# 4. Run ID verification
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "DOWNLOAD_URL_FROM_STEP_2"
  }'
# Save the "profileId" from response

# 5. Check status
curl -X GET "https://armith-backend-live.onrender.com/kyc/status/PROFILE_ID" \
  -H "x-api-key: ak_live_YOUR_KEY"
```

**Next:** [Full REST API Guide →](/guides/rest-api/get-started)

---

## Option B: Hosted Capture Pages (Redirect-Based)

**Best for:** Web apps, quick integration, no capture UI to build

### Prerequisites
- Armith account with dashboard access
- API key from **Integrations → API Keys**
- A callback URL in your app (e.g., `https://yourapp.com/kyc/callback`)

### 4-Step Flow

```bash
# 1. Create a KYC session (your backend)
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "order-12345",
    "countryCode": "TR",
    "channel": "web",
    "returnUrl": "https://yourapp.com/kyc/callback",
    "state": "csrf-token-abc123"
  }'
# Save "redirectUrl" and "profileId" from response

# 2. Redirect user to redirectUrl in their browser
# User completes ID capture + selfie on Armith's hosted page

# 3. User redirects back to your returnUrl with ?code=xxx&state=xxx

# 4. Exchange code for result (your backend)
curl -X POST "https://armith-backend-live.onrender.com/kyc/sessions/complete" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code": "CODE_FROM_CALLBACK", "state": "csrf-token-abc123"}'
```

**Next:** [Full Hosted Capture Guide →](/guides/hosted-capture/get-started)

---

## Option C: Mobile SDK (React Native)

**Best for:** React Native mobile apps, native camera experience

### Prerequisites
- React Native project (Expo dev client or bare RN)
- Armith account with API key
- Backend endpoint to create sessions

### Setup

```bash
# Install from Git (not yet on npm)
npm install github:armith/kyc-react-native
# Optional camera UI:
npm install github:armith/kyc-capture
```

### Basic Flow

```tsx
import { ArmithKyc } from '@armith/kyc-react-native';

const kyc = new ArmithKyc({ 
  apiBaseUrl: 'https://armith-backend-live.onrender.com' 
});

// 1. Your backend creates session, returns redirectUrl
// 2. Open Armith's hosted capture in WebView or browser
kyc.openSessionUrl(redirectUrl); // e.g., https://armith.onrender.com/m/start?t=...

// 3. Or use headless SDK with your own camera UI:
await kyc.startIdVerification({
  frontUri: imageUri,
  countryCode: 'TR'
});

await kyc.startSelfieVerification({ selfieUri: selfieUri });

const result = await kyc.pollStatus();
// result.status === 'APPROVED' | 'REJECTED' | etc.
```

**Next:** [Full Mobile SDK Guide →](/guides/mobile-sdk/get-started)

---

## Quick Decision: Which Path?

| Need | Choose |
|------|--------|
| Build your own upload UI, any backend language | **REST API** |
| Web app, want fastest integration, redirect OK | **Hosted Capture** |
| React Native app, want native camera | **Mobile SDK** |
| Need to test without real LLM calls | Use **Sandbox** keys (`ak_test_`) on any path |

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Check API key prefix: `ak_live_` for production, `ak_test_` for sandbox |
| `403 IP Forbidden` | Add your server IP to **Integrations → API Keys → IP Allowlist** |
| `BLURRY_IMAGE` | Ask user to retake photo with better lighting/focus |
| `PROFILE_ID_REQUIRED` | Run `id-check` first, use returned `profileId` for selfie |
| Monthly limit hit (20/mo free) | Upgrade plan or use `ak_test_` keys |

---

## What's Next?

- [Integration Patterns](/concepts/integration-patterns) — deeper comparison
- [Authentication](/reference/authentication) — API keys, sessions, idempotency
- [Webhooks](/guides/webhooks/get-started) — real-time results instead of polling
- [Troubleshooting](/troubleshooting/common-errors) — error codes with fixes