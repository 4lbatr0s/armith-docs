# Hosted Capture — Get Started

Let Armith host the ID + selfie UI. You create a session, redirect the user, get the result back. No capture UI to build.

Video Ident is a **separate product** — enable it in Settings and start it from the case page (`/v/start`), not as a hosted KYC step.

---

## How It Works (30 seconds)

```
Your Backend → Armith → redirectUrl → User completes capture on Armith page
→ redirects to your returnUrl?code=xxx → Your backend exchanges code → result
```

1. **Create session** (`POST /kyc/profiles`) — get `redirectUrl` + `profileId`
2. **Redirect user** to `redirectUrl`
3. **User completes** ID → selfie (if required) on Armith's page
4. **Callback** to your `returnUrl` with `?code=` or `?error=`
5. **Exchange code** (`POST /kyc/sessions/complete`) — slim `{ profileId, status, integrationExternalRef }`
6. **(Required for production)** Webhook delivers the official decisioned result. The `returnUrl` redirect is applicant UX only.

---

Applicants see a priming screen, consent before camera (`POST /kyc/sessions/consent`), overlay guidance, then ID → selfie (if required) → result. On `/w/start`, desktop users get a local QR + copy of `{origin}/m/start?t=…` for the **same write token** (the token is never sent to a third-party QR service). Hosted KYC never includes a Video Ident waiting room.

Result codes stay valid for **15 minutes** by default (`KYC_RESULT_CODE_TTL_SECONDS`, default 900). After success, the hosted page waits ~5 seconds then redirects to `returnUrl?code=&state=`.

---

## Step 1: Create a Session

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "order-12345",
    "countryCode": "TR",
    "channel": "web",
    "returnUrl": "https://yourapp.com/kyc/callback",
    "state": "csrf-token-abc123",
    "ttlSeconds": 900
  }'
```

| Field | Required | Notes |
|-------|----------|-------|
| `integrationExternalRef` | yes | Your order/user ID (1–256 chars) |
| `returnUrl` | yes | Must match your tenant allowlist (`kycReturnUrlAllowlist`). Production rejects `*`. |
| `state` | yes | CSRF token 8–256 chars — echoed back unchanged |
| `countryCode` | no | Defaults to `TR` |
| `channel` | no | `web` or `mobile` — picks `/w/start` vs `/m/start` |
| `ttlSeconds` | no | 60–604800, **default 900** (15 min) |
| `workflowId` | no | Tenant workflow overlay (1–128 chars) |
| `integrationMetadata` | no | Max 20 keys, echoed in webhooks |

**Response:**
```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "redirectUrl": "https://armith.onrender.com/w/start?t=eyJhbGciOi...",
  "expiresAt": "2026-06-01T13:00:00Z"
}
```

> Never expose your API key to the browser. The `redirectUrl` contains a short-lived, write-scoped token (`t=`) — safe to redirect.

---

## Step 2: Redirect the User

```js
// Express example
res.redirect(redirectUrl);
```

```html
<!-- Or a button -->
<a href="REDIRECT_URL">Verify my identity</a>
```

Armith's page guides the user through: prime → consent → ID front → ID back (if needed) → selfie if required → result → auto-redirect back. Video Ident is a separate product on `/v/start`.

Mobile deep links work too: `"returnUrl": "yourapp://kyc/callback"`.

---

## Step 3: Handle the Callback

| Callback | Meaning |
|----------|---------|
| `?code=abc123&state=csrf-token-abc123` | Success — exchange the code |
| `?error=cancelled&state=...` | User cancelled |
| `?error=expired&state=...` | Session TTL expired |

**Always verify `state` matches what you sent** (CSRF protection).

```js
app.get('/kyc/callback', async (req, res) => {
  if (req.query.state !== req.session.kycState) {
    return res.status(403).send('Invalid state');
  }
  if (req.query.error) {
    return res.render('kyc-cancelled', { error: req.query.error });
  }
  // Exchange code server-side (next step)
});
```

---

## Step 4: Exchange Code for Result

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/sessions/complete" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code": "CODE_FROM_CALLBACK", "state": "csrf-token-abc123"}'
```

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "status": "approved",
  "integrationExternalRef": "order-12345"
}
```

> The exchange returns a **slim** payload (`profileId`, lowercase `status`, `integrationExternalRef`). Full scores live on the [webhook](/guides/webhooks/get-started) and `GET /kyc/status/:profileId`. Codes are single-use. Only mintable after terminal status (`APPROVED`, `REJECTED`, `FAILED`, `UNDER_REVIEW`). Production stores codes in Redis (`503 RESULT_CODE_STORE_UNAVAILABLE` if Redis is down). Invalid/expired/used codes → `400 RESULT_CODE_INVALID`.

---

## Retry: Mint Another Session

User's photos rejected? Create a fresh capture link for the same profile:

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles/PROFILE_ID/sessions" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"channel": "web", "returnUrl": "https://yourapp.com/kyc/callback", "state": "new-state-xyz", "ttlSeconds": 1800}'
```

Simple one-shot variant (no prior profile): `POST /kyc/hosted-sessions` — same body, defaults `channel: web`.

Admin **Mint capture session** (`POST /admin/verifications/:profileId/capture-session`) issues a **v1 read-only** token for `GET /kyc/status`. It cannot open `/w/start` or `/m/start`. Integrator write links come from `POST /kyc/profiles`, `POST /kyc/profiles/:id/sessions`, or `POST /kyc/hosted-sessions`.

---

## Test Locally

1. Use `ak_test_` key — same flow, deterministic results.
2. Set `returnUrl` to `http://localhost:3000/kyc/callback` and add it to your tenant allowlist.
3. Open `redirectUrl` in a browser, upload any test image.
4. Callback fires with a real `code` you can exchange.

---

## Checklist

- [ ] `returnUrl` added to tenant allowlist
- [ ] `state` generated per session, validated on callback
- [ ] Code exchanged server-side (never expose API key client-side)
- [ ] Webhook configured for `verification.completed` / `verification.failed`
- [ ] Cancelled/expired callbacks handled in UI

**Next:** [Webhooks →](/guides/webhooks/get-started) · [Sandbox Testing →](/reference/sandbox-testing) · [Troubleshooting →](/troubleshooting/common-errors)