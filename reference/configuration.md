# Configuration (Thresholds, Presets, Rules)

Defaults work for most tenants. Change only what you need: **Admin → Settings** for common keys, `PATCH /config` for advanced, presets for one-click bundles.

---

## Presets (Start Here)

| Preset | Use |
|--------|-----|
| `balanced` | Default, general purpose |
| `strict` | Financial onboarding, high security |
| `lenient` | Low-risk flows, higher pass rates |

```bash
curl -X GET "https://armith-backend-live.onrender.com/config/presets"
curl -X POST "https://armith-backend-live.onrender.com/config/preset" \
  -H "Authorization: Bearer $CLERK_JWT" -H "Content-Type: application/json" \
  -d '{"preset": "balanced"}'
```

---

## Common Keys (Admin → Settings / `PUT /admin/settings`)

| Key | Default (balanced) | Meaning |
|-----|-------------------|---------|
| `matchConfidence` | 92 (0–100) | Face-match bar |
| `spoofingRiskMax` | 0.25 | Max acceptable spoofing risk |
| `fullNameConfidence` | 0.80 | Name-field floor |
| `identityNumberConfidence` | 0.90 | ID-number floor |
| `dateOfBirthConfidence` / `expiryDateConfidence` | 0.85 | DOB / expiry floors |
| `minMrzConfidence` | 0.80 | MRZ read floor |
| `idMinImageQuality` / `selfieMinImageQuality` | 0.62 | LLM quality floors |
| `idMinCaptureSharpness` / `selfieMinCaptureSharpness` | 0.38 | Preflight blur gates — lower = stricter |
| `minDocumentVitalityConfidence` | 0.55 | Document liveness |
| `faceDetectionConfidence` / `minLivenessConfidence` | 0.78 | Face + liveness floors |
| `minLiveMatchConfidence` | 92 (0–100) | Live Video Ident face vs ID portrait |
| `minActiveLivenessConfidence` | 0.80 | Active liveness on the live call |
| `maxDeepfakeRisk` | 0.25 | Max injection / deepfake risk on the live still |
| `minCallQualityScore` | 0.45 | Resolution / freeze floor |
| `minDurationSeconds` | 45 | Reject drive-by joins |
| `videocallDecisionMode` | `hybrid` | `hybrid` · `auto` · `agent_required` (human in the loop; not a certification) |
| `minAge` / `maxAge` / `enforceAgeCheck` | 18 / 120 / true | Age rules |
| Verification steps | ID + selfie | Require ID / selfie / AML. Video Ident is `videocallEnabled` (product on/off; not a KYC step). `videocallRequiresKycApproved` (default on) gates Video Ident on KYC `APPROVED`. |

Changes apply immediately to new verifications.

---

## Advanced (`PATCH /config`, Clerk + optimistic locking)

`idCardThresholds.minOverallConfidence`, `maxTamperingRisk` · `selfieThresholds.requiredFaceCount`, `minAngleDifference`, `requireMultipleAngles` · `videocallThresholds` (`decisionMode`, `requireAgentConfirmation`, `requireDocumentOnCamera`, auto-review match band, `maxQueueWaitSeconds`) · `validationRules` (TC checksum, MRZ cross-check, `maxWarningCount` default 3, expiry, `warningEscalationStatus`) · `verificationFeatures` (`videocallEnabled` default off, `videocallRequiresKycApproved` default on, auto-review bands, `riskScoreCeiling` default 55) · `adapters` (screening/face/liveness provider).

**Auto-review → `UNDER_REVIEW`:** warnings ≥ `maxWarningCount`, risk > `riskScoreCeiling`, or borderline confidence/spoofing bands. Webhook: `verification.manual_review_queued`.

---

## Tuning Cheat Sheet

| Symptom | Try |
|---------|-----|
| Blurry uploads reaching LLM | Raise sharpness gate (e.g. 0.38 → 0.42) |
| Legit users failing on motion blur | Lower slightly (e.g. → 0.32) or improve capture UX |
| False face-match approvals | Raise `matchConfidence` (e.g. 95+) |
| Too many auto-reviews | Widen bands / raise `riskScoreCeiling` |
| Too many false rejections | `lenient` preset |
| High-risk docs passing | `strict` preset / lower `maxTamperingRisk` |

Deep dive: [Threshold Tuning →](/advanced/threshold-tuning). Pipeline internals: [How It Works →](/concepts/how-it-works).