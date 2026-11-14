# Security and compliance

What Armith does with personal data, and what a regulated customer needs to know. This page is a technical description, not legal advice.

## Data protection

- **Encryption at rest.** Names, ID numbers, dates of birth, addresses, chip data and call transcripts are encrypted per tenant with AES-256-GCM, bound to tenant, record and field. Keys come from OpenBao Transit (recommended) or a master key you supply.
- **Lookups without plaintext.** Searches and duplicate checks use keyed hashes (blind indexes), exact match only, scoped to one tenant. There is no cross-tenant search.
- **Retention.** Applicant media (photos, selfies, call recordings) must have an explicit decision in production: a purge age with a schedule, or keep-forever on purpose.
- **Erasure and export.** `DELETE /admin/data-subject/{profileId}` erases personal data (including call transcripts and stored media) unless the profile is on legal hold. `GET /admin/data-subject/{profileId}/export` returns everything held, including transcripts.
- **Account closure.** Deleting an organisation revokes API keys, disables webhooks and blocks the account.

## Where data goes

| Data | Stays on | Leaves your infrastructure only if you enable |
|---|---|---|
| ID photos, selfies, chip data | your database and storage | an AI provider for ID reading (off in [sovereign mode](/advanced/sovereign-mode)) |
| Face and liveness processing | the biometrics service you host | nothing |
| Call recordings | your storage | nothing |
| AI voice agent audio | the voice worker and its providers (speech-to-text, language model, text-to-speech, avatar) | you decide per tenant whether to use an AI answerer |
| Reviewer briefing | statuses and scores only | the AI provider, only when enabled |

## Responsibilities (template)

Use this as the outline of a data processing agreement; have counsel complete it.

1. **Roles.** The customer is the controller; Armith (or the operator hosting it) is the processor.
2. **Subject matter and duration.** Identity verification of the customer's applicants for the contract term.
3. **Data categories.** Identity document data, biometric templates (face match scores, not stored templates), video and audio of calls, device facts.
4. **Sub-processors.** List every provider in the table above that the customer has enabled, with region.
5. **International transfers.** Needed only when an AI provider outside the customer's region is enabled; use the applicable transfer mechanism (EU standard contractual clauses; for Türkiye, the KVKK transfer rules).
6. **Security measures.** The list on this page.
7. **Assistance.** Erasure and export endpoints for data subject requests.
8. **Breach notification and audit rights.**

## Regulatory notes

- **EU AI Act.** Disclosure that a person is speaking with an AI applies from 2 August 2026; Armith speaks and records it on every AI call. High-risk obligations for biometric systems are scheduled for 2 December 2027; confirm classification of 1:1 verification with counsel.
- **AMLR / eIDAS.** The AML Regulation applies from 10 July 2027; EU Digital Identity Wallets are expected to be an accepted route for regulated entities around the end of 2027. Armith verifies national eID chips and documents today; a wallet verifier is planned.
- **Germany.** BaFin requires a trained human on video identification; Armith enforces this by default ([Video Ident](/advanced/video-ident)).
- **Türkiye.** KVKK applies; VERBIS registration is the customer's responsibility.
