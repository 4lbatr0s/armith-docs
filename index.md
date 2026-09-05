# Armith KYC API Documentation

Armith is an **API-first** identity verification platform: verify ID documents + selfies via REST API, hosted capture pages, or React Native SDK — with webhooks for real-time results.

<script setup>
const appUrl = import.meta.env.VITE_APP_URL || 'https://armith.onrender.com';
</script>

<a :href="appUrl" target="_blank" rel="noopener noreferrer" class="armith-btn-primary">
  Open dashboard
</a>

## Start Here (5 minutes)

**New?** Go to [Quickstart →](/quickstart) — pick REST API, Hosted Capture, or Mobile SDK and get verified in ~5 minutes.

**Choosing?** [Choose Your Path →](/concepts/integration-patterns) — decision flowchart for your stack.

**Curious how it works?** [How It Works →](/concepts/how-it-works) — preflight → LLM → server decision, in one diagram.

## Integration Options

| Option | Best for | Guide |
|--------|----------|-------|
| **REST API** | Custom UI, any backend language | [Get Started →](/guides/rest-api/get-started) |
| **Hosted Capture** | Web apps, fastest integration (redirect) | [Get Started →](/guides/hosted-capture/get-started) |
| **Mobile SDK** | React Native, native camera | [Get Started →](/guides/mobile-sdk/get-started) |
| **Webhooks** | Real-time results (all paths) | [Get Started →](/guides/webhooks/get-started) |

## Base URLs

- **Sandbox / shared dev:** `https://armith-backend-live.onrender.com` (use `ak_test_` keys)
- **Production:** `https://api.armith.com` or your tenant domain (use `ak_live_` keys)
- **Dashboard:** `https://armith.onrender.com`

Local dev: backend `http://localhost:3001`, dashboard `http://localhost:3000`.

## Capabilities

- ID + selfie + eID NFC verification (Groq vision + deterministic server rules)
- Preflight quality gates (blur, adversarial, face) before any LLM call
- Hosted capture pages (`/w/start`, `/m/start`) + React Native SDK
- Webhooks with HMAC signing + multi-endpoint fan-out
- KYB entity records (manual), AML/sanctions/PEP screening
- Async (BullMQ) processing, sandbox fixtures, manual review queue
- Configurable thresholds + presets (`strict` / `balanced` / `lenient`), GDPR tooling

Roadmap: official web SDK widget, more country validators, enhanced liveness, passport/residence-permit detection.

## Reading Order

1. [Quickstart](/quickstart) — 5-min tutorial for your path
2. [How It Works](/concepts/how-it-works) — mental model
3. Guide for your path: [REST](/guides/rest-api/get-started) · [Hosted](/guides/hosted-capture/get-started) · [Mobile](/guides/mobile-sdk/get-started)
4. [Webhooks](/guides/webhooks/get-started) — real-time results
5. [Authentication](/reference/authentication) · [Status Codes](/reference/status-codes) · [Sandbox](/reference/sandbox-testing)
6. [Troubleshooting](/troubleshooting/common-errors) when something breaks; [Advanced](/advanced/threshold-tuning) only when tuning

## Environments

| Environment | Backend URL | Dashboard URL | Purpose |
|-------------|-------------|---------------|---------|
| Local dev | `http://localhost:3001` | `http://localhost:3000` | Development |
| Sandbox | `https://armith-backend-live.onrender.com` | `https://armith.onrender.com` | Integration testing |
| Production | `https://api.armith.com` | `https://armith.onrender.com` | Live traffic |
