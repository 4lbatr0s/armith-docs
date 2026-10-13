# Advanced: Screening (AML / Sanctions / PEP)

Optional post-ID step. When `requireAml` is on, extracted identity (name, DOB, nationality) is screened; results persist on the profile and can block or route to review.

**Providers:** `opensanctions` (default, open source, no key) · `complyadvantage` (needs `COMPLYADVANTAGE_API_KEY`) · `dilisense`/`diligence` (commercial).

```bash
curl -X PATCH "$BASE/config" -H "Authorization: Bearer $CLERK_JWT" -H "Content-Type: application/json" \
  -d '{"verificationSteps": {"requireAml": true}, "adapters": {"screening": "opensanctions"}}'
```

**Result** on `GET /kyc/status/:profileId` → `screening`: `status` = `pending` · `clear` · `sanctions` · `sanctions_review` · `pep` · `unavailable` · `skipped` · `misconfigured`, plus `sanctionsMatch`, `pepMatch`, `hits[]` (list, name, matchType, confidence, source).

**Policy:** `clear` → proceed · `sanctions` (strong match: vendor `match` flag or score ≥ `AML_SANCTIONS_STRONG_SCORE`, default 0.95) → `REJECTED` with `SANCTIONS_HIT` (4101) · `sanctions_review` (weaker sanctions candidate) → `UNDER_REVIEW` with `SANCTIONS_REVIEW` (4106), because fuzzy matches on common names must not auto-reject · `pep` → `UNDER_REVIEW` with `PEP_HIT` (4102) · `unavailable` (vendor timeout/error/missing key while AML is required) → `UNDER_REVIEW` with `AML_UNAVAILABLE` (4105) — **never auto-approved** · `skipped` only occurs for orphan jobs when AML is not required · `requireAml` + `SCREENING_PROVIDER=none` → fail closed `AML_NOT_CONFIGURED` (4104) · never show hit details to end-users; log for compliance; subscribe to `verification.manual_review_queued`.