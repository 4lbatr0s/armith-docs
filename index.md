---
outline: [2, 3]
---

<span class="armith-kicker">Identity verification API</span>

# Armith KYC API

Verify ID documents and selfies via **REST API**, **hosted capture pages**, or the **React Native SDK** — with webhooks for real-time results.

<script setup>
const appUrl = import.meta.env.VITE_APP_URL || 'https://armith.onrender.com';
</script>

<p class="armith-cta-row">
  <a href="/quickstart" class="armith-btn-primary">Start in 5 minutes</a>
  <a :href="appUrl" target="_blank" rel="noopener noreferrer">Open the Armith dashboard</a>
</p>

<p class="armith-trust-line">
  TLS in transit, tenant-isolated records, HMAC-signed webhooks, and
  <a href="/advanced/data-subject-rights">GDPR data-subject tools</a>.
  Security contact lives on the
  <a :href="appUrl + '/trust'" target="_blank" rel="noopener noreferrer">Trust page</a>.
</p>

## Choose your path

<div class="armith-api-grid">
  <a class="armith-api-card" href="/quickstart">
    <span class="armith-api-card-title">⚡ Quickstart (5 min)</span>
    <span class="armith-api-card-desc">Get verified fast — REST, hosted, or mobile in one page.</span>
  </a>
  <a class="armith-api-card" href="/guides/rest-api/get-started">
    <span class="armith-api-card-title">🔌 REST API</span>
    <span class="armith-api-card-desc">Custom upload UI, any backend language. Full control.</span>
  </a>
  <a class="armith-api-card" href="/guides/hosted-capture/get-started">
    <span class="armith-api-card-title">🖥️ Hosted Capture</span>
    <span class="armith-api-card-desc">Redirect flow — Armith hosts the ID + selfie UI.</span>
  </a>
  <a class="armith-api-card" href="/guides/mobile-sdk/get-started">
    <span class="armith-api-card-title">📱 Mobile SDK</span>
    <span class="armith-api-card-desc">Native in-app KYC for React Native.</span>
  </a>
  <a class="armith-api-card" href="/guides/webhooks/get-started">
    <span class="armith-api-card-title">🔔 Webhooks</span>
    <span class="armith-api-card-desc">Real-time results with HMAC-signed delivery.</span>
  </a>
  <a class="armith-api-card" href="/concepts/how-it-works">
    <span class="armith-api-card-title">🧠 How it works</span>
    <span class="armith-api-card-desc">Preflight → LLM → server decision, in one diagram.</span>
  </a>
</div>

## Base URLs

<div class="armith-api-hero">
  <div>
    <p class="armith-api-hero-title">Sandbox (testing)</p>
    <code>https://armith-backend-live.onrender.com</code><br />
    <span style="font-size: 0.8rem">Use <code>ak_test_</code> keys — free, deterministic.</span>
  </div>
  <div>
    <p class="armith-api-hero-title">Production</p>
    <code>https://api.armith.com</code><br />
    <span style="font-size: 0.8rem">Use <code>ak_live_</code> keys — or your tenant domain.</span>
  </div>
</div>

**Dashboard:** `https://armith.onrender.com` · Local dev: backend `http://localhost:3001`, dashboard `http://localhost:3000`.

## Capabilities

- ID + selfie + eID NFC verification (Groq vision + deterministic server rules)
- Preflight quality gates (blur, adversarial, face) before any LLM call
- Hosted capture pages (`/w/start`, `/m/start`) + React Native SDK
- Webhooks with HMAC signing + multi-endpoint fan-out
- KYB entity records (manual), AML/sanctions/PEP screening
- Async (BullMQ) processing, sandbox fixtures, manual review queue
- Configurable thresholds + presets (`strict` / `balanced` / `lenient`), GDPR tooling

Roadmap: official web SDK widget, more country validators, enhanced liveness, passport/residence-permit detection.

## Suggested reading order

1. [Quickstart](/quickstart) — 5-min tutorial for your path
2. [How It Works](/concepts/how-it-works) — mental model
3. Guide for your path: [REST](/guides/rest-api/get-started) · [Hosted](/guides/hosted-capture/get-started) · [Mobile](/guides/mobile-sdk/get-started)
4. [Webhooks](/guides/webhooks/get-started) — real-time results
5. [Authentication](/reference/authentication) · [Status Codes](/reference/status-codes) · [Sandbox](/reference/sandbox-testing)
6. [Troubleshooting](/troubleshooting/common-errors) when something breaks; [Advanced](/advanced/threshold-tuning) only when tuning
