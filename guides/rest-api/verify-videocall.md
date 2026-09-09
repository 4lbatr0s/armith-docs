# Verify Video Ident — REST API

Live recorded video identification is a **separate product** from KYC. KYC is ID + selfie + AML. Video Ident has its own session, status, and recording. Turning it on in Settings does **not** block KYC approval.

Armith does **not** claim BaFin, RBI V-CIP, or SEPBLAC certification. Use `videocallThresholds.decisionMode` (`agent_required` vs `hybrid` vs `auto`) to keep a human in the loop where your policy requires it. Media is DTLS-SRTP to LiveKit Cloud (trusted SFU) so the call can be recorded and an AI copilot can sample frames. True client-to-client E2EE cannot coexist with recording.

Enable the product with `verificationFeatures.videocallEnabled` (Admin → Settings → Video Ident). Legacy `requireVideocall` is treated as the same flag on read.

By default, **Video Ident can start or finish only after KYC is `APPROVED`** (`videocallRequiresKycApproved`, default on). Turn that off to run Video Ident as a fully separate flow. KYC approval never waits on Video Ident.

---

## Flow

1. Tenant enables Video Ident (independent of KYC).
2. Start from an existing profile: Admin case → **Start Video Ident** (copies `/v/start?t=…`) or mint `POST /kyc/videocall/session` with a write token.
3. Applicant opens `/v/start`, consents to recording, joins LiveKit (`wsUrl` + `token`).
4. Optional: `POST /kyc/videocall/frame` with a still (`frameImageUrl` or `frameDataUrl`) for Groq scores vs the ID portrait when one exists.
5. Tenant agent claims the room from Admin → Video desk (`POST /admin/videocall/:id/claim`).
6. Hangup / agent disposition → `POST /kyc/videocall-check` (or LiveKit room-finished webhook).

KYC hosted capture (`/w/start`, `/m/start`) never includes this step.

---

## Mint a session

```
POST https://armith-backend-live.onrender.com/kyc/videocall/session
```

Headers: `x-api-key` or `X-Verification-Session` (capture write token). Video Ident must be enabled. By default the profile KYC status must already be `APPROVED` (`VIDEOCALL_KYC_REQUIRED` / 4314 if not). Turn off `videocallRequiresKycApproved` to skip that check.

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
  "roomName": "armith-vc-…",
  "wsUrl": "wss://….livekit.cloud",
  "token": "eyJ…",
  "status": "waiting",
  "livekitConfigured": true
}
```

LiveKit credentials never leave the API. The SPA/SDK only receives a short-lived participant JWT.

---

## Heartbeat / frames / finalize

| Endpoint | Purpose |
|----------|---------|
| `POST /kyc/videocall/heartbeat` | Applicant still waiting (`sessionId`) |
| `POST /kyc/videocall/frame` | Groq still vs ID portrait |
| `POST /kyc/videocall-check` | Finalize Video Ident scores (does not change `profile.status`) |

Frame body:

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "sessionId": "…",
  "frameDataUrl": "data:image/jpeg;base64,…"
}
```

Finalize is **server-gated**. The LLM never has the last word.

- `auto` — thresholds only
- `hybrid` (default) — green `APPROVED`, gray `UNDER_REVIEW`, red `REJECTED`
- `agent_required` — AI is advisory until an agent posts disposition

Outcome is stored on `VideocallValidation` / `profile.videocallVerificationStatus`. It does **not** rewrite KYC `profile.status`.

---

## Status

`GET /kyc/status/:profileId` includes a sibling product object:

- `videocall` `{ enabled, requiresKycApproved, status, completed, approved, sessionId }`
- `videocallVerification` scores + confidence rows when a call has been scored
- `progress.isFullyVerified` is ID + selfie + AML only
- `session.lifecycle.phase` never waits on video (`awaiting_id` / `awaiting_selfie` only)

---

## Admin

Clerk, tenant-scoped:

| Endpoint | Purpose |
|----------|---------|
| `POST /admin/videocall/:profileId/invite` | Mint applicant `/v/start` write token |
| `GET /admin/videocall/queue` | Waiting / in-call rooms |
| `POST /admin/videocall/:id/claim` | Agent JWT |
| `POST /admin/videocall/:id/disposition` | `{ "disposition": "approved" \| "rejected", "notes": "…" }` |
| `GET /admin/videocall/:id/recording` | Signed R2 download (never a public LiveKit URL) |

---

## Error family (43xx)

`VIDEOCALL_NOT_ENABLED` · `VIDEOCALL_NOT_REQUIRED` (same 4301) · `VIDEOCALL_KYC_REQUIRED` (4314) · `VIDEOCALL_CONSENT_REQUIRED` · `VIDEOCALL_NOT_CONFIGURED` · `VIDEOCALL_TIMEOUT` · `VIDEOCALL_QUALITY` · `VIDEOCALL_LIVENESS` · `VIDEOCALL_DEEPFAKE` · `VIDEOCALL_LOW_MATCH` · `VIDEOCALL_TOO_SHORT` · `VIDEOCALL_DOCUMENT_NOT_SHOWN` · `VIDEOCALL_NO_AGENT` · `VIDEOCALL_RECORDING_FAILED`

---

## Next

- [Hosted Capture](/guides/hosted-capture/get-started) — ID + selfie only
- [Configuration](/reference/configuration) — `videocallEnabled`, `videocallRequiresKycApproved`, `videocallThresholds`
- [Mobile SDK](/guides/mobile-sdk/get-started) — token + heartbeat + frame + finalize (join LiveKit with the official RN SDK separately)
