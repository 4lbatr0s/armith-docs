# Integration Patterns — Choose Your Path

A decision guide to pick the right Armith integration for your stack.

---

## Quick Comparison

| Factor | REST API | Hosted Capture | Mobile SDK |
|--------|----------|----------------|------------|
| **Your effort** | Medium | Low | Medium |
| **Capture UI** | You build | Armith hosts | You build (or use our camera) |
| **Integration** | Backend only | Backend + redirect | React Native app |
| **User flow** | Seamless in-app | Redirect to Armith | In-app (WebView or native) |
| **Best for** | Custom UX, any language | Web apps, fastest ship | Native mobile apps |
| **Latency** | ~2-4s sync | User-paced | ~2-4s sync |
| **Testing** | `ak_test_` keys | `ak_test_` keys | `ak_test_` keys |

---

## Decision Flowchart

```
START
  │
  ├─► Building a React Native app?
  │       │
  │       ├─ YES ──► Use Mobile SDK
  │       │
  │       └─ NO ──► Building a web app?
  │                     │
  │                     ├─ YES ──► Want to build your own capture UI?
  │                     │       │
  │                     │       ├─ YES ──► Use REST API
  │                     │       │
  │                     │       └─ NO ──► Use Hosted Capture
  │                     │
  │                     └─ NO ──► Server-to-server / backend only?
  │                             │
  │                             ├─ YES ──► Use REST API
  │                             │
  │                             └─ NO ──► Use Hosted Capture (simplest)
```

---

## Pattern Details

### REST API — Direct Integration

**You control everything.** Build your upload UI, call our endpoints in sequence.

```
Your Frontend          Your Backend           Armith
    │                     │                    │
    │  User selects file  │                    │
    │────────────────────►│                    │
    │                     │  POST /upload-url  │
    │                     │───────────────────►│
    │                     │◄────── uploadUrl ──│
    │                     │                    │
    │  PUT file to URL    │                    │
    │─────────────────────────────────────────►│ (R2 storage)
    │                     │                    │
    │                     │  POST /id-check    │
    │                     │───────────────────►│
    │                     │◄────── result ─────│
```

**When to choose:**
- You need custom capture UX (branding, flow, multiple doc types)
- Backend is not Node.js (Python, Go, Java, .NET, etc.)
- You already have image upload pipeline
- Need to verify without user interaction (batch, background)

**Start here:** [REST API Guide →](/guides/rest-api/get-started)

---

### Hosted Capture — Redirect Flow

**Armith handles the capture UI.** You create a session, redirect user, get result back.

```
Your Backend           Armith API           User Browser
    │                     │                    │
    │  POST /profiles     │                    │
    │────────────────────►│                    │
    │◄───── redirectUrl ──│                    │
    │                     │                    │
    │  Redirect user      │                    │
    │─────────────────────────────────────────►│
    │                     │  Capture ID + Selfie  │
    │                     │◄──────────────────────│
    │                     │                    │
    │                     │  Redirect to returnUrl  │
    │◄──────────────────────────────────────────│
    │                     │                    │
    │  POST /sessions/complete                │
    │────────────────────►│                    │
    │◄───── slim status ───│                    │
```

Webhooks (or `GET /kyc/status`) are the official decisioned result.

**When to choose:**
- Web app, want integration in hours not days
- Don't want to build/maintain capture UI
- OK with brief redirect (user leaves your domain)
- Need mobile-responsive capture without native app

**Start here:** [Hosted Capture Guide →](/guides/hosted-capture/get-started)

---

### Mobile SDK — React Native

**Native in-app experience.** Use our headless client + optional camera screens.

```
Your RN App              Your Backend           Armith
    │                     │                    │
    │                     │  POST /profiles    │
    │                     │───────────────────►│
    │                     │◄──── redirectUrl ─│
    │                     │                    │
    │  kyc.openSessionUrl()                   │
    │         or                              │
    │  kyc.startIdVerification()              │
    │         (your camera UI)                │
    │─────────────────────────────────────────►│ (uploads + verify)
    │                     │◄──── result ──────│
```

**When to choose:**
- Building a React Native app (Expo dev client or bare)
- Want native camera (not WebView)
- Need offline-capable capture flow
- Already using `@armith/kyc-react-native`

**Start here:** [Mobile SDK Guide →](/guides/mobile-sdk/get-started)

---

## Hybrid Approaches

| Scenario | Recommendation |
|----------|----------------|
| Web app + future mobile | Start with Hosted Capture, add Mobile SDK later |
| Backend batch + user-facing | REST API for batch, Hosted Capture for users |
| Multiple frontends (web, iOS, Android) | REST API on backend, each frontend calls your backend |
| White-label / embedded | REST API (full control) or Hosted Capture with custom domain |

---

## All Paths Support

- **Same verification engine** — identical results
- **Same webhooks** — `verification.completed`, `verification.failed` (source of truth)
- **Same sandbox** — `ak_test_` keys work on ID/selfie paths (not Video Ident)
- **Same status polling** — `GET /kyc/status/:profileId`
- **Same authentication** — API keys on backend, write session tokens for capture

---

## What's Next?

- [Quickstart](/quickstart) — 5-min tutorial for your chosen path
- [How It Works](/concepts/how-it-works) — deeper technical mental model
- [Authentication](/reference/authentication) — API keys, sessions, idempotency