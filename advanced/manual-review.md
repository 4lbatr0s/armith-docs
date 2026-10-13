# Advanced: Manual Review

Profiles land in `UNDER_REVIEW` via auto-escalation (warnings ≥ `maxWarningCount` def. 3, risk > `riskScoreCeiling` def. 55, borderline bands) or admin enqueue. Webhook: `verification.manual_review_queued`; decision fires `verification.manual_review_resolved`.

```bash
GET  /admin/manual-reviews?page=1&limit=10&source=auto        # source=auto|manual
POST /admin/manual-reviews/:profileId/enqueue                 # {"assigneeLabel": "..."}  (reviewer role)
PATCH /admin/manual-reviews/:profileId                        # {"assigneeLabel": "...", "note": "..."}
POST /admin/manual-reviews/:profileId/resolve                 # {"decision": "APPROVED"|"REJECTED", "note": "..."}  (reviewer role; note REQUIRED when REJECTED)
```

Every action lands in `manualReviewAuditTrail` (`QUEUED` → `REASSIGNED` → `RESOLVED_*`). Dashboard: **Admin → Manual Reviews**; verifications list: `GET /admin/verifications?status=UNDER_REVIEW`; detail + timeline: `GET /admin/verifications/:id` and `/events`.

**SLA:** the review deadline is set server-side from `MANUAL_REVIEW_SLA_HOURS` (default 72, max 720); it is not a per-request parameter. It is stored as `manualReviewDeadlineAt` and shown as *overdue* in the dashboard; it does not auto-resolve or notify by itself.

**Concurrency:** a resolve is an atomic `UNDER_REVIEW` → decision transition. If another reviewer (or a double click) resolved the case first you get `409 ALREADY_RESOLVED` and no second webhook is sent.

**Roles:** enqueue / patch / resolve and the Video Desk need the organization role `reviewer` or higher; deleting verifications, API keys, settings and webhooks need `admin`. Every one of these actions is written to `GET /admin/audit-log`.
