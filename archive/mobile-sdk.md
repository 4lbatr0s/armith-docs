# Mobile SDK (React Native)

Armith ships **two** React Native packages. They are not published to npm yet — install from git or a local path.

| Package | Role |
|---------|------|
| `@armith/kyc-react-native` | Headless client: session URL, upload, id/selfie-check, poll, result redirect |
| `@armith/kyc-capture` | Optional native camera UI (vision-camera + on-device ML Kit) |

Hosted browser capture (`/m/start`, `/w/start` on the **dashboard origin**) is a third path and does not require either package.

## Headless SDK — `@armith/kyc-react-native`

```ts
import { ArmithKyc, KycError } from '@armith/kyc-react-native';

const kyc = new ArmithKyc({ apiBaseUrl: 'https://armith-backend-live.onrender.com' });

kyc.openSessionUrl(redirectUrl); // /m/start?t=… or /w/start?t=…
await kyc.startIdVerification({
  frontUri,
  backUri,
  countryCode: 'TR',
  sandboxScenario: 'approved' // required for ak_test_* tenants
});
await kyc.startSelfieVerification({ selfieUri, sandboxScenario: 'approved' });
await kyc.pollStatus();
const { returnUrl } = await kyc.completeAndRedirect();
```

### API surface

| Method | Description |
|--------|-------------|
| `getSupportedCountries(apiBaseUrl)` | `GET /kyc/countries` |
| `openSessionUrl(url)` | Parse redirect URL, store write token |
| `startIdVerification(input)` | Presign → upload → `id-check` |
| `startSelfieVerification(input)` | Presign → upload → `selfie-check` |
| `pollStatus(options?)` | Poll `GET /kyc/status/:profileId` |
| `completeAndRedirect()` | Mint result code + build `returnUrl` |

## Capture UI — `@armith/kyc-capture`

Optional screens that return `{ uri, mimeType }` for the headless SDK. Requires an Expo dev client or bare RN (`expo prebuild`). Expo Go is not supported.

```tsx
import { KycIdCaptureScreen, KycSelfieCaptureScreen } from '@armith/kyc-capture';
import { ArmithKyc } from '@armith/kyc-react-native';

<KycIdCaptureScreen
  side="front"
  onCaptured={(img) => kyc.startIdVerification({ frontUri: img.uri, countryCode: 'TR' })}
  onCancel={() => navigation.goBack()}
/>
```

## Backend flow (same as hosted)

Your server (API key only) creates a session. Never put `ak_live_*` in the mobile app.

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "user-order-123",
    "countryCode": "TR",
    "channel": "mobile",
    "returnUrl": "yourapp://kyc/callback",
    "state": "opaque-state-string-abc123",
    "ttlSeconds": 3600
  }'
```

Response `redirectUrl` uses `KYC_REDIRECT_BASE_URL` (the **frontend** origin), for example:

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "redirectUrl": "https://armith.onrender.com/m/start?t=<session-token>",
  "expiresAt": "2026-06-01T13:00:00Z"
}
```

After capture, exchange the one-time `code` on your backend:

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/sessions/complete" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "code": "<result-code>", "state": "opaque-state-string-abc123" }'
```

## Channels

| Channel | Redirect path | Typical client |
|---------|---------------|----------------|
| `mobile` | `/m/start?t=…` | This SDK, or a WebView of the hosted page |
| `web` | `/w/start?t=…` | Hosted browser page |

## Testing

```bash
# From armith repo root
npm run test:mobile
```

Runs tests in `mobile/sdk/armith-kyc-react-native/test/` and `mobile/sdk/armith-kyc-capture/test/`.

## Notes

- Session tokens are **write-scoped** and short-lived.
- Result codes are mintable only after the profile is `APPROVED`, `REJECTED`, `FAILED`, or `UNDER_REVIEW`.
- Store the result code and exchange it server-side — never expose your API key in the mobile app.
