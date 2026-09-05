# Advanced: Data Subject Rights (GDPR)

- **Export:** `GET /admin/verifications/:profileId` returns full profile + validations + evidence for DSAR fulfillment.
- **Delete:** `DELETE /admin/verifications/:profileId` removes profile, validations, webhook deliveries, and optionally R2 objects.
- **Retention:** configure Mongo + R2 lifecycle policies per tenant; screening hits and audit trails follow the same retention as the profile.

Respond to erasure/export requests within your statutory window; log fulfillment in the audit trail.