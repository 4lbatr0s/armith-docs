# Advanced: Video Ident

::: warning On hold
This feature is on hold. See [Feature status](/concepts/feature-status). Do not rely on it for a regulatory duty.
:::

Live video identification. You decide, per tenant, who answers the call: a human agent, an AI agent (with an optional avatar), or the AI first with a human taking over. Each country's regulatory minimum is enforced on top of your choice.

## Choosing who answers

In **Settings → Video Ident** (or `PUT /admin/settings` with `videocallAnswerer`):

| Value | What happens |
|---|---|
| `human` (default) | The call goes to the reviewer queue and a human takes it. |
| `ai` | An AI voice agent answers. A human reviewer still makes every decision. |
| `ai_then_human` | The AI answers. A human takes over if the reviewer claims the call, if the applicant asks for a person, or if the AI has not answered within `humanFallbackSeconds` (15 to 300, default 45). |

Anything unknown resolves to `human`.

## Regulatory floor

Some regulators require a trained human agent on the call. For those countries Armith runs a human call whatever the tenant chose, records `floorApplied` and the basis on the session, and shows a notice in Settings. Built-in: **DE** (BaFin Circular 3/2017) and **TR** (BDDK/TCMB remote identification rules). These entries reflect the public reading of the rules and are marked *confirm with counsel*. Operators can correct the list without a code change:

```
VIDEOCALL_HUMAN_REQUIRED_COUNTRIES=DE,TR   # set to empty to disable every floor
```

## Per-call settings

`videocallPolicy` in the settings:

| Field | Default | Meaning |
|---|---|---|
| `recording` | `true` | Record the call to your storage. Turn off only if your regulator allows it. |
| `transcript` | `false` | For AI calls: store what was said, encrypted, exported with and erased with the applicant. |
| `language` | `auto` | Language the AI agent speaks: `auto` (follows the applicant), `tr`, `en`, `de`, `fr`, `es`, `it`, `nl`, `pl`. The speaking voice is limited by your text-to-speech provider. |
| `humanFallbackSeconds` | `45` | Only for `ai_then_human`. |

## AI disclosure

Whenever an AI is involved, the session response carries an `aiDisclosure` (`version`, `text`) for your UI, and the agent speaks the same notice before anything else (in the configured language). The moment it was spoken is stored as `policy.aiDisclosedAt` on the session. The notice says it is an AI, that the call is recorded, that a human decides, and that the applicant can ask for a person.

## Taking over and asking for a human

- A reviewer who claims an AI call takes it over: the AI leaves the room, and the hand-over (who, when, why) is recorded in `answererHistory`.
- `POST /kyc/videocall/request-human` (applicant session): the call moves to a human. Always honoured.

## Reviewer desk

`GET /admin/videocall/{id}/evidence` returns what the reviewer should see beside the video: chip authenticity, chip photo vs selfie, selfie and ID status, call scores, hand-overs, policy, and rule-based flags (for example `CHIP_PHOTO_DOES_NOT_MATCH_SELFIE`, `HIGH_DEEPFAKE_RISK`, `VIRTUAL_CAMERA_DETECTED`). It contains statuses and scores only, never personal data.

### Reviewer AI briefing (optional)

Off by default. When a tenant turns it on (`reviewCopilotEnabled`), `POST /admin/videocall/{id}/copilot` returns a short advisory summary and suggested questions. Only codes, statuses and scores are sent to the AI provider: no names, documents, transcripts or reviewer ids. The briefing never recommends approving or rejecting and never changes a decision; if the provider is unavailable the endpoint reports `available: false`.

## Camera-injection signals

Frames carry optional device facts (camera name, emulator and root hints, an attestation token). They raise flags for the reviewer; they never clear a risk. Detected: virtual-camera software names, emulators, rooted devices, a camera swapped mid-call, replayed frames. Only a **verified** attestation counts as positive evidence, and verifying one needs credentials that belong to you (Google Play Integrity service account, Apple App Attest ids): register a verifier with `registerAttestationVerifier`. Until then tokens report "not configured".

## Hosting the AI agent

The AI worker is a separate process (`backend/Dockerfile`, built for LiveKit Cloud Agents). It needs `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GROQ_API_KEY` and, for an avatar, `ANAM_API_KEY`.
