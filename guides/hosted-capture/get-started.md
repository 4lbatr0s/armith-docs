# Hosted Capture — Get Started

Let Armith host the ID + selfie UI. You create a session, redirect the user, get the result back. No capture UI to build.

---

## How It Works (30 seconds)

```
Your Backend → Armith → redirectUrl → User completes capture on Armith page
→ redirects to your returnUrl?code=xxx → Your backend exchanges code → result
```

1. **Create session** (`POST /kyc/profiles`) — get `redirectUrl` + `profileId`
2. **Redirect user** to `redirectUrl`
3. **User completes** ID + selfie on Armith's page
4. **Callback** to your `returnUrl` with `?code=` or `?error=`
5. **Exchange code** (`POST /kyc/sessions/complete`) — get full result
6. **(Recommended)** Webhook delivers the same result in real time

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
    "ttlSeconds": 3600
  }'
```

| Field | Required | Notes |
|-------|----------|-------|
| `integrationExternalRef` | yes | Your order/user ID (1–256 chars) |
| `returnUrl` | yes | Must match your tenant allowlist (`kycReturnUrlAllowlist`) |
| `state` | yes | CSRF token 8–256 chars — echoed back unchanged |
| `countryCode` | no | Defaults to `TR` |
| `channel` | no | `web` or `mobile` — picks `/w/start` vs `/m/start` |
| `ttlSeconds` | no | 60–604800, default 3600 |
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

Armith's page guides the user through: ID front → ID back (if needed) → selfie → verification → auto-redirect back.

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
  "status": "APPROVED",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "country": "TR",
  "idVerification": { "status": "APPROVED", "fullName": "Ada Lovelace", "overallConfidence": 0.94 },
  "selfieVerification": { "status": "APPROVED", "matchConfidence": 96 },
  "progress": { "isFullyVerified": true }
}
```

> Codes are single-use and short-lived. Exchange immediately. Only mintable after terminal status (`APPROVED`, `REJECTED`, `FAILED`, `UNDER_REVIEW`).

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