# Mobile SDK — Get Started (React Native)

Native in-app KYC for React Native. Two packages: a headless client + an optional camera UI.

---

## Packages

| Package | What it does |
|---------|--------------|
| `@armith/kyc-react-native` | Headless: session URL, upload, id/selfie-check, Video Ident session/heartbeat/frame/finalize, poll, result code |
| `@armith/kyc-capture` | Optional camera screens (vision-camera + ML Kit). Needs dev client / bare RN — **not Expo Go** |

> Not on npm yet — install from git. Hosted browser capture (`/m/start`, `/w/start`) works without either package.

---

## Install

```bash
npm install github:armith/kyc-react-native
# Optional camera UI:
npm install github:armith/kyc-capture
```

`@armith/kyc-capture` requires `expo prebuild` or bare RN + camera permissions.

---

## Backend First (Never Put API Keys in the App)

Your server creates the session — same as hosted capture:

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "user-order-123",
    "countryCode": "TR",
    "channel": "mobile",
    "returnUrl": "yourapp://kyc/callback",
    "state": "opaque-state-abc123",
    "ttlSeconds": 3600
  }'
```

Response `redirectUrl` looks like `https://armith.onrender.com/m/start?t=<token>`.

---

## Option A: Open Hosted Page (Fastest)

Open the hosted capture in a WebView / browser — no camera code needed:

```ts
import { ArmithKyc } from '@armith/kyc-react-native';

const kyc = new ArmithKyc({ apiBaseUrl: 'https://armith-backend-live.onrender.com' });
kyc.openSessionUrl(redirectUrl); // parses /m/start, /w/start, or Video Ident /v/start
```

After the user finishes, exchange the result `code` **on your backend** (`POST /kyc/sessions/complete`).

---

## Option B: Headless + Your Own Camera

```ts
// 1. ID
await kyc.startIdVerification({
  frontUri,           // local file URI from your camera
  backUri,            // optional
  countryCode: 'TR',
  sandboxScenario: 'approved', // required for ak_test_* tenants
});

// 2. Selfie
await kyc.startSelfieVerification({ selfieUri, sandboxScenario: 'approved' });

// 3. Poll + finish
await kyc.pollStatus(); // resolves when APPROVED / REJECTED / etc.
const { returnUrl } = await kyc.completeAndRedirect();
```

### SDK Methods

| Method | Does |
|--------|------|
| `getSupportedCountries(apiBaseUrl)` | `GET /kyc/countries` |
| `openSessionUrl(url)` | Parse `/m/start`, `/w/start`, or `/v/start`; store write token |
| `openVideocallInviteUrl(url)` | Parse `/v/start` invite (skips `expectedChannel`; dashboard invites are web) |
| `startIdVerification(input)` | Presign → upload → `id-check` |
| `startSelfieVerification(input)` | Presign → upload → `selfie-check` |
| `startVideocallSession(recordingConsent?)` | Mint LiveKit applicant JWT (`POST /kyc/videocall/session`). Independent of KYC approval; tenant must enable Video Ident. Join the room with `@livekit/react-native`. |
| `videocallHeartbeat(sessionId)` | Applicant still waiting |
| `submitVideocallFrame(input)` | Groq still (`frameImageUrl` or `frameDataUrl`) |
| `finalizeVideocall(sessionId?)` | `POST /kyc/videocall-check` |
| `pollStatus(options?)` | Poll `GET /kyc/status/:profileId` |
| `completeAndRedirect()` | Mint result code + build `returnUrl` |

---

## Option C: Headless + Armith Camera UI

```tsx
import { KycIdCaptureScreen, KycSelfieCaptureScreen } from '@armith/kyc-capture';
import { ArmithKyc } from '@armith/kyc-react-native';

<KycIdCaptureScreen
  side="front"
  onCaptured={(img) => kyc.startIdVerification({ frontUri: img.uri, countryCode: 'TR' })}
  onCancel={() => navigation.goBack()}
/>
```

The screens return `{ uri, mimeType }` — feed straight into the headless SDK.

---

## Rules

- Session tokens are **write-scoped, short-lived, bound to one profile**.
- Result codes mintable only after terminal status (`APPROVED`, `REJECTED`, `FAILED`, `UNDER_REVIEW`).
- **Never ship `ak_live_*` in the app binary.** All API-key calls go through your backend.
- Test with `ak_test_*` + `sandboxScenario: 'approved'`.

```bash
# Run SDK tests from the armith repo
npm run test:mobile
```

**Next:** [Webhooks →](/guides/webhooks/get-started) · [Errors →](/troubleshooting/common-errors) · [Status codes →](/reference/status-codes)