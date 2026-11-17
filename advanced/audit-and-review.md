# Advanced: Audit, audit packs and four-eyes review

Regulators inspect cases. Armith gives you a tamper-evident audit trail, a one-document audit pack per case, and
optional four-eyes approval for manual review.

## Tamper-evident audit trail

Every admin audit event is numbered and hash-chained per tenant: each event's hash covers the previous hash and the
event's own fields. Editing, deleting or inserting an event in the middle breaks every hash after it.

`GET /admin/audit-log/verify` (admin) recomputes the chain and returns `ok`, the event count, the head
(`headSeq`, `headHash`), `firstBreak`, `gaps` and `unacknowledgedTombstones`.

- A **gap** (a missing number) or a **break** (content changed, link broken) makes `ok` false.
- A **tombstone** (`audit_chain.gap_filled`) marks a number whose writer died before storing its event. It is never
  reported as clean: it may be a crash or a deleted event, so a person investigates and acknowledges it. The
  acknowledgement is itself a chained event naming who accepted it.
- Writing never drops an event: the number comes from one atomic increment and hashes are sealed afterwards in order.

**What it proves and what it does not.** It proves the recorded events are exactly the events that were written, in
order. It cannot stop someone with full database access from rewriting the whole chain from the start. Export the
head (`headSeq` + `headHash`) regularly to a place that person cannot write (a signed email, a ticket, an
object-lock bucket) and compare.

## Audit pack

`GET /admin/profiles/{profileId}/audit-pack` (admin) returns one JSON document per case:

| Section | Holds |
|---|---|
| `subject` | The profile, consent, ID, selfie and chip validations, timeline, call transcript (decrypted: it contains personal data) |
| `videocall` | Each call: who answered, the policy and regulatory floor applied, hand-overs, scores, injection signals, recording key |
| `decisions` | Every decision about the case: who, when, what, and its place in the audit chain |
| `configuration` | Country, policy pack, configuration version and recent revisions |
| `auditChain` | The chain state at the moment of export |

`sha256` covers the sections: change any of them and the digest changes. Media is referenced by object key, not
embedded. Each export is itself an audit event (`audit_pack.export`) carrying the digest.

## Four-eyes approval

In **Settings → Verification rules**, turn on *Four-eyes approval for manual review* (optionally from a risk score).
A reviewer's decision then only **proposes**; a **different** person must confirm the same decision. The same person can
never both propose and confirm. If the second reviewer disagrees, their decision replaces the proposal and the case
needs another look. Proposals expire after 24 hours. Both approvers are recorded in the audit chain. The API answers
`202` with `pendingSecondApproval` until the second confirmation; `409 FOUR_EYES_SAME_PERSON` if one person tries
twice; `409 REVIEW_STATE_CHANGED` if the case changed while the reviewer was deciding.

## Documents that expire: who needs a fresh check

Regulated firms must keep identity data current. List approved people whose document has expired or expires soon:

```
GET /admin/reverification/due?days=60            # JSON (reviewer role)
GET /admin/reverification/due?days=60&format=csv # CSV download
```

`days` is 1 to 365 (default 60). Each row has the case id, country, expiry date, days left and whether it already expired, sorted by expiry date. The list holds no names or numbers, so it is safe to share. To re-check a person, create a new capture link for the case (Cases menu > capture link, or send it by WhatsApp or email).

### Webhook: `verification.reverification_due`

Subscribe an endpoint to this event to be told when an approved person's document expired or expires within the notice window (default 30 days). The event is sent once per expiry date. The payload `data` holds `profileId`, `expiryDate`, `daysToExpiry` and `expired`. The operator turns the daily job on with `REVERIFICATION_NOTICE_ENABLED=1` and sets the window with `REVERIFICATION_NOTICE_DAYS`. An endpoint with no event filter receives all events, so set a filter if you do not want this one.
