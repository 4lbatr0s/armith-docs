# Verify Video Ident — REST API

Live recorded video identification is a **separate product** from KYC. KYC is ID + selfie + AML. Video Ident has its own session, status, and recording. Turning it on in Settings does **not** block KYC approval.

Armith does **not** claim BaFin, RBI V-CIP, or SEPBLAC certification. Use `videocallThresholds.decisionMode` (`agent_required` vs `hybrid` vs `auto`) to keep a human in the loop where your policy requires it. Media is DTLS-SRTP to LiveKit Cloud (trusted SFU) so the call can be recorded and an AI copilot can sample frames. True client-to-client E2EE cannot coexist with recording.

Enable the product with `verificationFeatures.videocallEnabled` (Admin → Settings → Video Ident). Legacy `requireVideocall` is treated as the same flag on read.

By default, **Video Ident can start or finish only after KYC is `APPROVED`** (`videocallRequiresKycApproved`, default on). Turn that off to run Video Ident as a fully separate flow. KYC approval never waits on Video Ident.

Production default is **fail-closed**: `decisionMode` is `agent_required`, Groq stills are agent-assist only, and LiveKit hangup does **not** auto-approve.

---

## Flow

1. Tenant enables Video Ident (independent of KYC).
2. Start from an existing profile: Admin case → **Start Video Ident** (copies `/v/start?t=…`) or mint `POST /kyc/videocall/session` with a write token / API key.
3. Applicant opens `/v/start`, consents to recording (`POST /kyc/sessions/consent` or `recordingConsent: true`), joins LiveKit (`wsUrl` + `token`).
4. Optional: `POST /kyc/videocall/frame` with a still (`frameImageUrl` or `frameDataUrl`) for Groq scores vs the ID portrait when one exists. `sessionId` is required.
5. Tenant agent claims the room from Admin → Video desk (`POST /admin/videocall/:id/claim`). Two agents cannot claim the same room.
6. Agent disposition (`POST /admin/videocall/:id/disposition`) runs `POST /kyc/videocall-check`. LiveKit `room_finished` / `egress_ended` mark the session `abandoned` and do **not** finalize.

KYC hosted capture (`/w/start`, `/m/start`) never includes this step.

---

## Mint a session

```
POST https://armith-backend-live.onrender.com/kyc/videocall/session
```

Headers: `x-api-key` or `X-Verification-Session` (capture **write** token). Video Ident must be enabled. By default the profile KYC status must already be `APPROVED` (`VIDEOCALL_KYC_REQUIRED` / 4314 if not). Turn off `videocallRequiresKycApproved` to skip that check.

`profileId` is optional when a write capture token can bind a **PENDING shell profile** — only if the KYC gate is off. If the gate is on and there is no approved profile, the API returns `VIDEOCALL_KYC_REQUIRED`. No profile and no capture session → `PROFILE_ID_REQUIRED`.

Consent: send `recordingConsent: true`, or record it first with `POST /kyc/sessions/consent` (`purpose` defaults to `identity_verification`). Otherwise `VIDEOCALL_CONSENT_REQUIRED` / 4313.

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "recordingConsent": true
}
```

**Response**

```json
{
  "sessionId": "…",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "roomName": "armith-vc-…",
  "wsUrl": "wss://….livekit.cloud",
  "token": "eyJ…",
  "status": "waiting",
  "livekitConfigured": true
}
```

LiveKit credentials never leave the API. The SPA/SDK only receives a short-lived participant JWT. Missing LiveKit in production → `503 VIDEOCALL_NOT_CONFIGURED` (4309).

---

## Heartbeat / frames / finalize

| Endpoint | Purpose |
|----------|---------|
| `POST /kyc/videocall/heartbeat` | Applicant still waiting. Body `{ "sessionId" }` (required). Returns `frameCount`. |
| `POST /kyc/videocall/frame` | Groq still vs ID portrait. `sessionId` required. |
| `POST /kyc/videocall-check` | Finalize Video Ident scores (does **not** change KYC `profile.status`) |

Frame body:

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "sessionId": "…",
  "frameDataUrl": "data:image/jpeg;base64,…"
}
```

Finalize is **server-gated**. Groq stills never have the last word. Default `videocallThresholds`:

| Key | Default |
|-----|---------|
| `decisionMode` | `agent_required` |
| `requireAgentConfirmation` | `true` |
| `minFrameCount` | `3` |
| `minLiveMatchConfidence` | `92` |
| `minActiveLivenessConfidence` | `0.80` |
| `maxDeepfakeRisk` | `0.25` |
| `minCallQualityScore` | `0.45` |
| `minDurationSeconds` | `45` |
| `requireDocumentOnCamera` | `true` |

| Mode | Without agent disposition | With agent `approved` |
|------|---------------------------|------------------------|
| `agent_required` (default) | No claim → `409 VIDEOCALL_NO_AGENT` (4307). After claim, errors → `UNDER_REVIEW`, else `PENDING`. | `APPROVED`, unless fewer than `minFrameCount` scored frames → `UNDER_REVIEW` (`VIDEOCALL_NO_FRAMES` / 4315) |
| `hybrid` | Errors in match band 78–91 → `UNDER_REVIEW`, else `REJECTED`. Clean path is `UNDER_REVIEW`, **not** `APPROVED`. | Same as above |
| `auto` | Errors → `REJECTED`. Clean path is `UNDER_REVIEW` (single-JPEG Groq is agent-assist only). | Same as above |

Need at least **3** scored frames (`minFrameCount`) when LiveKit is configured, or finalize records `VIDEOCALL_NO_FRAMES`. Agent disposition without a stored recording key (and document-on-camera required) → `VIDEOCALL_RECORDING_FAILED` (4308).

Outcome is stored on `VideocallValidation` / `profile.videocallVerificationStatus`. It does **not** rewrite KYC `profile.status`.

---

## Status

`GET /kyc/status/:profileId` includes a sibling product object:

- `videocall` `{ enabled, requiresKycApproved, status, completed, approved, sessionId }`
- `videocallVerification` scores + confidence rows when a call has been scored
- `progress.isFullyVerified` is ID + selfie + AML only
- `verificationRules.requireVideocall` is always `false`
- `session.lifecycle.phase` never waits on video (`awaiting_id` / `awaiting_selfie` only)

---

## Admin

Clerk, tenant-scoped. Dashboard: **Admin → Video desk** (`?tab=video_desk`). Queue badge is the count of `waiting` rooms, polled from `GET /admin/videocall/queue`. Deep link `/admin?tab=video_desk&join={sessionId}` auto-claims.

| Endpoint | Purpose |
|----------|---------|
| `POST /admin/videocall/:profileId/invite` | Mint applicant `/v/start` **write** token. 200 `{ token, expiresAtEpochSec, profileId, captureSessionId }`. 409 `VIDEOCALL_NOT_ENABLED` / `VIDEOCALL_KYC_REQUIRED`. |
| `GET /admin/videocall/queue` | Waiting + in-call rooms (max 50) |
| `POST /admin/videocall/:id/claim` | Atomic claim. Same agent can rejoin. Conflict → `409 VIDEOCALL_ALREADY_CLAIMED` (4316) with `claimedBy`. |
| `POST /admin/videocall/:id/disposition` | `{ "disposition": "approved" \| "rejected", "notes": "…" }` |
| `GET /admin/videocall/:id/recording` | Signed R2 download (never a public LiveKit URL). 404 `VIDEOCALL_RECORDING_FAILED` if no object key. |

`POST /admin/verifications/:profileId/capture-session` is a **v1 read-only** status token. It cannot drive `/v/start`, `/w/start`, or `/m/start`. Use the Video Ident invite or `POST /kyc/profiles` for write links.

---

## Error family (43xx)

`VIDEOCALL_NOT_ENABLED` · `VIDEOCALL_NOT_REQUIRED` (same 4301) · `VIDEOCALL_KYC_REQUIRED` (4314) · `VIDEOCALL_CONSENT_REQUIRED` (4313) · `VIDEOCALL_NOT_CONFIGURED` (4309, HTTP 503 in production) · `VIDEOCALL_TIMEOUT` · `VIDEOCALL_QUALITY` · `VIDEOCALL_LIVENESS` · `VIDEOCALL_DEEPFAKE` · `VIDEOCALL_LOW_MATCH` · `VIDEOCALL_TOO_SHORT` · `VIDEOCALL_DOCUMENT_NOT_SHOWN` · `VIDEOCALL_NO_AGENT` (4307, HTTP 409 when mode ≠ `auto` and no claim) · `VIDEOCALL_RECORDING_FAILED` (4308) · `VIDEOCALL_NO_FRAMES` (4315) · `VIDEOCALL_ALREADY_CLAIMED` (4316)

---

## Next

- [Hosted Capture](/guides/hosted-capture/get-started) — ID + selfie only
- [Configuration](/reference/configuration) — `videocallEnabled`, `videocallRequiresKycApproved`, `videocallThresholds`
- [Mobile SDK](/guides/mobile-sdk/get-started) — token + heartbeat + frame + finalize (join LiveKit with the official RN SDK separately)
