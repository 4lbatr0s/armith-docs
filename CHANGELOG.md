# Changelog

Changes that affect people who use the Armith API, the dashboard or the hosted pages. The API version is in `public/openapi.yaml` (now 1.2.0). Dates are UTC.

## 2026-11-17

- **Fixed** An invalid request body on `POST /kyc/id-check`, `/kyc/selfie-check`, `/kyc/profiles`, `/kyc/hosted-sessions` and `/kyc/sessions/complete` answered `500 INTERNAL_ERROR` instead of `400` with the list of invalid fields (a library upgrade renamed a field the validator read). It now answers `400` with `details`.
- **Fixed** A malformed id in an admin URL (for example `DELETE /admin/api-keys/abc`) answered `500`. It now answers `400 INVALID_ID`.
- **Fixed** Calls to the admin, config and KYB admin APIs with no credentials were redirected (`302`) to the home page. They now answer `401` JSON.
- **Fixed** The video desk "claim" call (`POST /admin/videocall/{id}/claim`) answered `500` for everyone since a database library upgrade. Video Ident is still on hold.
- **Fixed** `DELETE /admin/verifications/{profileId}` deleted a case that was on legal hold. It now answers `409 LEGAL_HOLD` and keeps the case, like the data-subject erase and the retention jobs already did.
- **Fixed** Hosted capture on the web (`/w/start`) showed "invalid link" for every session created with `POST /kyc/profiles` or `POST /kyc/hosted-sessions`, because the page expected a profile id that those calls do not return yet. The page now accepts both token types. If you saw this error on a fresh link, create a new session after updating.
- **Added** Public benchmark of face matching on the LFW test list, with its limits: see [Threshold tuning](/advanced/threshold-tuning).
- **Added** 21 more admin routes in the OpenAPI spec (audit, usage, regulation profiles, re-verification, workflow revisions, manual review, webhook retry, data-subject export).
- **Added** Monthly usage report: Dashboard > Cases > "Usage CSV", or `GET /admin/account/usage/export.csv?months=12` (admin role). One row per month with the number of cases per status.
- **Added** German and French on the hosted applicant pages (machine translation, native review is pending). The language menu lists them. Missing text falls back to English.
- **Added** Guide: [Getting CSCA certificates](/advanced/csca-sources) and an import script that checks certificates before you load them.

## 2026-11-16

- **Added** API key scopes: `kyc:read` and `kyc:write`. A key with no scope keeps full access, so existing keys do not change. Set scopes when you create a key, or use "Make read-only" in the dashboard.
- **Added** One webhook delivery log under Integrations.
- **Added** Saved case filters are kept per user and organisation. They never store search text.
- **Changed** Stricter security headers on the API (CSP, HSTS, Referrer-Policy, Permissions-Policy, no-store by default).
- **Changed** The biometrics service accepts the previous and the new token during a token rotation, so a rotation needs no downtime.
- **Added** Android test app: reading the chip of an ID card by NFC (preview, not yet tested on a real card).

## 2026-11-14 to 2026-11-15

- **Added** Policy rules: readable conditions that can hold a case for review or reject it. Rules can only tighten an outcome, never approve.
- **Added** Tamper-evident audit chain, per-case audit pack and four-eyes approval.
- **Added** Compliance role (read-only audit access).
- **Added** Sandbox test people for EU countries; Node and Python SDKs; `@armith/web` helper for hosted capture.
- **Added** Video Ident modes: human, AI, or AI then human, with legal minimums per country.
- **Added** Sovereign mode: read the ID card from its machine-readable zone with no third-party AI.
- **Added** On-device capture guidance in eight languages (EN, TR, DE, FR, ES, IT, NL, PL).
- **Changed** New dashboard design ("Ink & Paper") for all pages, including hosted capture.
- **Changed** Personal data is encrypted at rest with envelope encryption.
- **Fixed** Selfie camera crash on some Android devices.
- **Fixed** `/admin/webhooks` crash for organisation sessions.
