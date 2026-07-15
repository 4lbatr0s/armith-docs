# Mobile SDK (React Native)

Armith provides a **headless React Native SDK** for integrating KYC capture directly into your mobile app. The SDK manages ID document capture, selfie capture, upload, and verification — all within your app's native UI.

## Architecture

```
Your App (React Native)
        │
        ├── armith-kyc-react-native (SDK)
        │       ├── openSessionUrl(url) — starts capture flow
        │       ├── ID document capture (front + back)
        │       ├── Selfie capture
        │       ├── Upload to Armith R2 storage
        │       ├── Poll for verification result
        │       └── Redirect to returnUrl with result code
        │
        └── Your backend
                ├── POST /kyc/profiles → gets redirectUrl
                ├── POST /kyc/profiles/:id/sessions → mint additional sessions
                └── Webhook receiver → terminal events
```

## SDK Package

| Package | Platform | Source |
|---------|----------|--------|
| `armith-kyc-react-native` | iOS + Android | `mobile/sdk/armith-kyc-react-native/` |

No npm registry publish yet — integrate via local path or git dependency.

## Prerequisites

- React Native 0.72+
- Camera and photo library permissions configured
- A backend server that can call Armith's integrator API (API key only)

## Integration Flow

### Step 1 — Create a profile (your backend)

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "user-order-123",
    "countryCode": "TR",
    "channel": "mobile",
    "integrationMetadata": {
      "appVersion": "2.1.0"
    },
    "returnUrl": "yourapp://kyc/callback",
    "state": "opaque-state-string-abc123",
    "ttlSeconds": 3600
  }'
```

Response:

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "redirectUrl": "https://armith-backend-live.onrender.com/m/start?t=<session-token>",
  "expiresAt": "2026-06-01T13:00:00Z"
}
```

### Step 2 — Open session URL in SDK

```typescript
import { ArmithKyc } from 'armith-kyc-react-native';

// Open the hosted capture flow in a WebView or system browser
ArmithKyc.openSessionUrl({
  url: 'https://armith-backend-live.onrender.com/m/start?t=eyJ...',
  onComplete: (result) => {
    // User completed the flow
    console.log('Result code:', result.code);
    console.log('State:', result.state);
  },
  onError: (error) => {
    console.error('Capture error:', error);
  },
  onCancel: () => {
    // User cancelled
  }
});
```

### Step 3 — Complete the session (your backend)

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/sessions/complete" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<result-code-from-redirect>",
    "state": "opaque-state-string-abc123"
  }'
```

Response:

```json
{
  "status": "APPROVED",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "idVerification": { "status": "APPROVED" },
  "selfieVerification": { "status": "APPROVED" }
}
```

### Step 4 — Receive webhook (optional but recommended)

Subscribe to `verification.completed` and `verification.failed` events on your webhook endpoint to get real-time terminal status without polling.

## SDK Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `openSessionUrl` | `{ url, onComplete, onError, onCancel }` | Opens the capture flow in a secure browser session |
| `openSessionUrl` with options | `{ url, onComplete, onError, onCancel, redirectScheme }` | Custom redirect URI scheme for deep link back to app |

## Capture Pages

Armith hosts the capture UI at two entry points:

| Channel | URL pattern | Description |
|---------|-------------|-------------|
| Mobile | `/m/start?t=<session-token>` | Mobile-optimized capture flow |
| Web | `/w/start?t=<session-token>` | Desktop-optimized capture flow |

The hosted pages handle:
1. ID document front/back capture
2. Selfie capture
3. Image preflight checks
4. Upload to Armith storage
5. Verification check execution
6. Redirect back to your `returnUrl` with result code

## Session Token (Write-Scoped)

The `t` parameter in the redirect URL is a **write-scoped session token** (`X-Verification-Session` header). It is:

- Bound to a specific `profileId` and tenant
- Limited in TTL (configurable, default 1 hour)
- Authorized only for the specific capture flow
- Not usable for admin or other tenant operations

## Polling vs Webhook

| Method | Latency | Reliability |
|--------|---------|-------------|
| **Session result code** (from redirect) | Instant after capture | Best — returned in URL |
| **Complete API** (`/kyc/sessions/complete`) | Near-real-time | Reliable — server-side exchange |
| **Webhook** | < 5 seconds | Most reliable — built-in retry |
| **Status poll** (`GET /kyc/status/:profileId`) | Poll interval | Fallback |

## SDK Testing

```bash
# From kyc-flow repo root
npm run test:mobile
```

Runs tests in `mobile/sdk/armith-kyc-react-native/test/`.

## Important Notes

- The SDK is **headless** — it does not include UI components. Capture UI is rendered on Armith's hosted pages.
- Session tokens are **write-scoped** and short-lived. They cannot be reused after the session expires.
- The `state` parameter is echoed back in the redirect and can be used for CSRF protection.
- Store the `resultCode` from the redirect and exchange it server-side via `/kyc/sessions/complete` — never expose your API key in the mobile app.
