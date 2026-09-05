# Advanced: Manual Review

Profiles land in `UNDER_REVIEW` via auto-escalation (warnings ≥ `maxWarningCount` def. 3, risk > `riskScoreCeiling` def. 55, borderline bands) or admin enqueue. Webhook: `verification.manual_review_queued`; decision fires `verification.manual_review_resolved`.

```bash
GET  /admin/manual-reviews?page=1&limit=10&source=auto        # source=auto|manual
POST /admin/manual-reviews/:profileId/enqueue                 # {"assigneeLabel": "...", "slaDeadlineMinutes": 240}
PATCH /admin/manual-reviews/:profileId                        # {"assigneeLabel": "...", "note": "..."}
POST /admin/manual-reviews/:profileId/resolve                 # {"decision": "APPROVED"|"REJECTED", "note": "..."}
```

Every action lands in `manualReviewAuditTrail` (`QUEUED` → `REASSIGNED` → `RESOLVED_*`). Dashboard: **Admin → Manual Reviews**; verifications list: `GET /admin/verifications?status=UNDER_REVIEW`; detail + timeline: `GET /admin/verifications/:id` and `/events`.