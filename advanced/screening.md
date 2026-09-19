# Advanced: Screening (AML / Sanctions / PEP)

Optional post-ID step. When `requireAml` is on, extracted identity (name, DOB, nationality) is screened; results persist on the profile and can block or route to review.

**Providers:** `opensanctions` (default, open source, no key) · `complyadvantage` (needs `COMPLYADVANTAGE_API_KEY`) · `dilisense`/`diligence` (commercial).

```bash
curl -X PATCH "$BASE/config" -H "Authorization: Bearer $CLERK_JWT" -H "Content-Type: application/json" \
  -d '{"verificationSteps": {"requireAml": true}, "adapters": {"screening": "opensanctions"}}'
```

**Result** on `GET /kyc/status/:profileId` → `screening`: `status` = `pending` · `clear` · `sanctions` · `pep` · `skipped` · `misconfigured`, plus `sanctionsMatch`, `pepMatch`, `hits[]` (list, name, matchType, confidence, source).

**Policy:** `clear` → proceed · `sanctions` → `REJECTED` with `SANCTIONS_HIT` (4101) · `pep` → `UNDER_REVIEW` with `PEP_HIT` (4102) · `requireAml` + `SCREENING_PROVIDER=none` → fail closed `AML_NOT_CONFIGURED` (4104) · never show hit details to end-users; log for compliance; subscribe to `verification.manual_review_queued`.