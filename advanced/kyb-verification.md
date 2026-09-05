# Advanced: KYB (Business Verification)

KYB entity records are **manual CRUD only** — no automated document verification yet.

- Create entity with legal name, registration number, jurisdiction (`/kyb/*`, API key or Clerk).
- Link person KYC `profileId`s as directors / beneficial owners.
- Track per-entity status; manage via dashboard or API.

Use KYC + Screening for the linked persons; keep the entity decision manual until automated KYB ships.