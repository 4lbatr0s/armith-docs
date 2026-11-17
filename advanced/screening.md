# Advanced: Screening (AML / Sanctions / PEP)

Optional post-ID step. When `requireAml` is on, extracted identity (name, DOB, nationality) is screened; results persist on the profile and can block or route to review.

**Providers:** `opensanctions` (default, open source, no key) · `complyadvantage` (needs `AML_VENDOR_URL` and `AML_PROVIDER_API_KEY`) · `dilisense`/`diligence` (commercial).

```bash
curl -X PATCH "$BASE/config" -H "Authorization: Bearer $CLERK_JWT" -H "Content-Type: application/json" \
  -d '{"verificationSteps": {"requireAml": true}, "adapters": {"screening": "opensanctions"}}'
```

**Result** on `GET /kyc/status/:profileId` → `screening`: `status` = `pending` · `clear` · `sanctions` · `sanctions_review` · `pep` · `unavailable` · `skipped` · `misconfigured`, plus `sanctionsMatch`, `pepMatch`, `hits[]` (list, name, matchType, confidence, source).

**Policy:** `clear` → proceed · `sanctions` (strong match: vendor `match` flag or score ≥ `AML_SANCTIONS_STRONG_SCORE`, default 0.95) → `REJECTED` with `SANCTIONS_HIT` (4101) · `sanctions_review` (weaker sanctions candidate) → `UNDER_REVIEW` with `SANCTIONS_REVIEW` (4106), because fuzzy matches on common names must not auto-reject · `pep` → `UNDER_REVIEW` with `PEP_HIT` (4102) · `unavailable` (vendor timeout/error/missing key while AML is required) → `UNDER_REVIEW` with `AML_UNAVAILABLE` (4105) — **never auto-approved** · `skipped` only occurs for orphan jobs when AML is not required · `requireAml` + `SCREENING_PROVIDER=none` → fail closed `AML_NOT_CONFIGURED` (4104) · never show hit details to end-users; log for compliance; subscribe to `verification.manual_review_queued`.
## Re-screening approved people

A person can be listed after you approved them. The operator turns on a daily re-screening job with `RESCREEN_ENABLED=1`. It only touches accounts that have AML screening on in their own settings, and it uses that account's own screening provider. It screens approved cases again every `RESCREEN_INTERVAL_DAYS` (default 30), at most `RESCREEN_MAX_PER_TICK` per day (default 10), so a free provider quota is not used up in one run.

- A **clear** result only refreshes the screening record.
- A **hit** (sanctions or PEP) moves the case from `APPROVED` to `UNDER_REVIEW`, adds a timeline entry and sends the `verification.manual_review_queued` webhook. A person decides. The job never rejects or approves by itself.
- If the provider fails, nothing changes and the case is tried again after a day. A case another reviewer already decided is never overwritten.
