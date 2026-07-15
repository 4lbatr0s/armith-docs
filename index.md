# Armith KYC API Documentation

Armith is an **API-first** identity verification platform with a dashboard for operations, settings, API keys, webhooks, and analytics.

Built for fintech, regtech, and digital identity teams who need a multi-country KYC solution with AI-powered verification, deterministic preflight gates, and flexible integration options — direct REST API, hosted capture pages, or mobile SDK.

<script setup>
const appUrl = import.meta.env.VITE_APP_URL || 'https://armith.onrender.com';
</script>

<a :href="appUrl" target="_blank" rel="noopener noreferrer" class="armith-btn-primary">
  Open dashboard
</a>

## Integration Options

| Option | Best for | Docs |
|--------|----------|------|
| **REST API** | Backend/server-side integrations (any language) | [Step-by-Step API Flow](/kyc-api-flow) |
| **Hosted Capture** | Web/mobile apps — Armith handles the upload UI via redirect | [Integrator Hosted Flow](/integrator-hosted-flow) |
| **Mobile SDK** | React Native apps — native ID capture + selfie camera UI | [Mobile SDK](/mobile-sdk) |

## What This Documentation Covers

1. Create and manage **API keys** (`Integrations → API Keys`)
2. Authenticate KYC requests (`x-api-key`, Clerk session, or capture session token)
3. Complete the direct REST API flow: upload → ID check → selfie check → status
4. Integrate via **hosted capture pages** with redirect-based flows
5. Integrate via **React Native SDK** for native mobile apps
6. Configure **outbound webhooks** with signing keys and optional payload fields
7. Understand **preflight gates** (blur, adversarial image checks) and verification outcomes
8. Use the live **REST API Playground** to inspect requests and responses
9. Manage **configurations, thresholds, and manual review** from the dashboard

## Product Capabilities

### Current

- REST API verification (ID + selfie + eID NFC)
- AI-powered document extraction and face matching via Groq LLM
- Deterministic preflight (blur, adversarial checks) before LLM
- Hosted capture pages for web and mobile channels
- React Native SDK for native mobile capture
- Outbound webhooks with HMAC signing + multi-webhook fan-out
- KYB (Know Your Business) entity verification
- AML/sanctions/PEP screening
- Async verification with BullMQ queue
- Sandbox testing with deterministic scenarios
- Manual review queue with auto-escalation and assignment
- Configurable verification workflows
- Admin analytics, audit log, and data subject rights (GDPR)
- Multi-tenant dashboard with role-based access

### On the roadmap

- Official web SDK (drop-in widget)
- Additional country validators
- Enhanced biometric liveness checks
- Document type detection (passport, residence permit)

## Base URL

Use your assigned API base URL:

- **Sandbox / shared dev:** `https://armith-backend-live.onrender.com`
- **Production (when provisioned):** `https://api.armith.com`

Ask Armith support for a dedicated tenant domain if your account uses one.

**Dashboard (SPA):** `https://armith.onrender.com`

## Supported KYC Flow Patterns

### Pattern A — Direct REST API

1. Sign in to the dashboard and create an API key under **Integrations → API Keys**
2. (Optional) Register **outbound webhooks** under **Integrations → Webhooks**
3. Request pre-signed upload URLs (`POST /kyc/upload-url`)
4. Upload ID and selfie images directly to object storage (R2)
5. Run ID verification (`POST /kyc/id-check`)
6. Run selfie verification (`POST /kyc/selfie-check`) when required
7. Poll session status (`GET /kyc/status/:profileId` or `GET /kyc/sessions/:id`)
8. Receive terminal events on your webhook endpoint (or poll status)

### Pattern B — Hosted Capture Pages

1. Call `POST /kyc/profiles` with `returnUrl` and `state` from your backend
2. Redirect end-user to the returned `redirectUrl`
3. Armith handles ID upload, selfie capture, and verification
4. User is redirected back to your `returnUrl` with the result
5. Receive terminal events on your webhook endpoint

### Pattern C — Mobile SDK

1. Integrate `armith-kyc-react-native` into your React Native app
2. Call `POST /kyc/profiles` from your backend to get a session
3. Open the session URL in the SDK's capture flow
4. Receive terminal events on your webhook endpoint

## Recommended Reading Order

1. [Getting Started](/getting-started) — pick your integration path
2. [Authentication](/authentication) — API keys, sessions, idempotency
3. [Integrations Dashboard](/integrations-dashboard) — webhooks, API keys, settings
4. Flow Guide — choose one:
   - [Step-by-Step API Flow](/kyc-api-flow) — direct REST
   - [Integrator Hosted Flow](/integrator-hosted-flow) — capture pages
   - [Mobile SDK](/mobile-sdk) — React Native
5. [Verification & Preflight](/verification-and-preflight) — quality gates, thresholds
6. [Outbound Webhooks](/webhooks) — event types, signing
7. [Statuses and Errors](/errors-and-statuses) — error handling
8. [Admin and Config APIs](/admin-and-config-apis) — operations
9. [REST API Playground](/api-reference) — interactive testing

## Environments

| Environment | Backend URL | Dashboard URL | Purpose |
|-------------|-------------|---------------|---------|
| Local dev | `http://localhost:3001` | `http://localhost:3000` | Development |
| Sandbox | `https://armith-backend-live.onrender.com` | `https://armith.onrender.com` | Integration testing |
| Production | `https://api.armith.com` | — | Live traffic |
