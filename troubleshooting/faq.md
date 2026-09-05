# FAQ

**Which integration should I pick?** Custom UI/any language → REST API · web app, fastest → Hosted Capture · React Native → Mobile SDK. ([Decision guide →](/concepts/integration-patterns))

**Do I need a backend?** Yes for production — API keys must stay server-side. Use capture-session tokens client-side.

**Sandbox or live?** `ak_test_` for all dev/CI (free, deterministic via `sandboxScenario`); `ak_live_` only for real traffic.

**Why is my image rejected as blurry?** Preflight blur gate (`idMinCaptureSharpness`/`selfieMinCaptureSharpness`, def. 0.38) runs before the LLM — retake sharper; don't retry the same file.

**ID passed but profile is PENDING?** Selfie step still required — complete `selfie-check`.

**Polling or webhooks?** Webhooks in production (`verification.completed`/`failed`); polling for backfill/debugging.

**Where do I find my result?** `GET /kyc/status/:profileId` anytime; webhooks push terminal events.

**How do retries work?** Same `Idempotency-Key` + same body = cached response (no double charge). New images = new key.

**Monthly limit?** Free: 20/mo → `PLAN_LIMIT_REACHED` (429). Upgrade or wait; sandbox doesn't count.

**Can I adjust pass/fail sensitivity?** Yes — presets (`strict`/`balanced`/`lenient`) or individual thresholds ([Configuration →](/reference/configuration)). Tune only with data.

**Does Armith store my users' images?** Yes (tenant-scoped R2 + Mongo), subject to your retention policy; GDPR export/delete via admin APIs ([DSR →](/advanced/data-subject-rights)).