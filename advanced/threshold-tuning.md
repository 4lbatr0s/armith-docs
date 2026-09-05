# Advanced: Threshold Tuning

> You probably don't need this. Start with the `balanced` preset ([Configuration →](/reference/configuration)). Come here only when metrics show a systematic problem.

## Method

1. Pull 50–100 recent rejections: `GET /admin/verifications?status=REJECTED`.
2. Group by `rejectionReasons` / error code.
3. Change **one** key at a time in Admin → Settings, measure for a week.

## Common Moves

| Symptom | Knob | Direction |
|---------|------|-----------|
| Blurry images reaching LLM | `idMinCaptureSharpness` / `selfieMinCaptureSharpness` | Raise (0.38 → 0.42 = stricter) |
| Good users failing on slight blur | Same | Lower (→ 0.32) **or** fix capture UX first |
| Strangers passing face match | `matchConfidence` | Raise (92 → 95+) |
| Too many `UNDER_REVIEW` | `riskScoreCeiling` (def. 55), auto-review bands | Raise ceiling / widen bands |
| Too many hard rejects | Preset | `lenient` |
| Risky docs passing | Preset / `maxTamperingRisk` | `strict` / lower ceiling |

## Guardrails

- **ID is lenient** (warnings can still approve); **selfie/eID are strict** (any error rejects). Don't try to make ID strict via thresholds alone — use workflows + manual review.
- LLM quality is capped by capture sharpness (`effectiveQuality = min(llmQuality, captureSharpness)`), so raising LLM floors without fixing capture won't help blurry traffic.
- Screening (`requireAml`) and eID are post-steps — tune them separately ([Screening →](/advanced/screening), [eID →](/advanced/eid-nfc)).

Snapshot of thresholds used per verification is returned on `GET /kyc/status/:profileId` (`thresholds`) — use it to debug "why did this reject?".