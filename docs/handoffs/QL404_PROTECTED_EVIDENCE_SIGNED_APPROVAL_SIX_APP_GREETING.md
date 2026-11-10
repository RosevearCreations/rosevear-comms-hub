# QL-404 — Protected Evidence Intake, Independent Review, Signed Owner Gate & Six-App Greeting

## Introduction from Rosevear Comms Hub

Hello, companion Rosevear Suite application. Comms Hub is the **Master Shell communications and operator plane** alongside AI Data Platform, which owns master intelligence and reporting. We need to reconcile the existing shell contract and previous PowerShell enrollment work, **not start over or ask anyone to repeat secrets in ChatGPT**. Each application remains the owner of its own staff, customer, payment and business data. We may consume only separately authorized, shell-level monitoring and incident events.

QL-403 was promoted on `main` as an original-evidence requirements casebook. QL-404 supplies a **private Node-only cryptographic verification boundary**: original byte digests, five distinct original artifacts, independently pinned source/reviewer/master Ed25519 identities, source/reviewer/master signatures, bounded TEST scope, source binding, freshness and replay rejection. All real pins and original bytes must come from a separately authenticated, protected owner workflow. No signer enrollment or original custody is created by publishing code.

**The QL-404 verifier cannot authorize an actual network TEST, set a database connection state, enroll a receiver, send an event, act on devices or release HOLD.** Its strongest positive result is `SIGNED_ORIGINAL_REVIEW_VERIFIED_CONNECTION_STILL_HELD`—an input for subsequent protected authorization, not an online connection claim.

## Simple test strings for each application's ChatGPT window

Copy only the matching line into that application's existing ChatGPT conversation:

| Application | Paste this exact string |
| --- | --- |
| Yard Workers | `QL404-COMMS-HELLO yw READ_ONLY` |
| iCamp | `QL404-COMMS-HELLO icamp READ_ONLY` |
| Rosie Dazzlers | `QL404-COMMS-HELLO rosiedazzlers READ_ONLY` |
| Devil n Dove | `QL404-COMMS-HELLO devilndove READ_ONLY` |
| AI Data Platform | `QL404-COMMS-HELLO ai-data-platform READ_ONLY` |
| Rosevear AI Hub | `QL404-COMMS-HELLO rosevear-ai-hub READ_ONLY` |

### What the matching application should do

1. Read this [QL-404 Comms Hub handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL404_PROTECTED_EVIDENCE_SIGNED_APPROVAL_SIX_APP_GREETING.md) and the [QL-365D six-app contract](QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md).
2. Confirm the exact registered shell source ID, repository, current `main` commit, manifest path and read-only health handler. Do not identify sample tenants (Camp Rosevear, Rosevear Landscaping) as separate applications.
3. Check whether existing original device/issuer/witness, source-owner approval, master-owner approval and signed TEST receipt evidence can actually be verified in the authentic protected setup. **Do not infer this from PowerShell history or successful CI.**
4. Return a short, **sanitized** answer using the following format. Unknown is acceptable:

   `QL404-ACK <source-id> | main=<sha-or-unknown> | manifest=<path> | handler=<path> | owner-proof=<VERIFIED-or-HOLD> | signed-receipt=<VERIFIED-or-HOLD> | connection=<VERIFIED-or-HOLD>`

5. If the application cannot produce original independent evidence, keep `HOLD` and report the **specific remaining step** without requesting a password or emitting an API key. Any real test must follow the existing private, one-source-at-a-time, independently approved TEST workflow.

This greeting is a **plain text coordination marker**, not a challenge-response credential, signed receipt, or active transport handshake. Do not treat an `ACK` from a ChatGPT window as cryptographic authentication.

## Exact source registry

| Source ID | Repository | Expected handler |
| --- | --- | --- |
| `yw` | [RosevearCreations/yw](https://github.com/RosevearCreations/yw) | `server/ql364-source-health.mjs` |
| `icamp` | [RosevearCreations/iCamp](https://github.com/RosevearCreations/iCamp) | `lib/integration-v1/ql364-source-health.mjs` |
| `rosiedazzlers` | [RosevearCreations/rosiedazzlers](https://github.com/RosevearCreations/rosiedazzlers) | `functions/api/_lib/ql364-source-health.mjs` |
| `devilndove` | [RosevearCreations/devilndove-site](https://github.com/RosevearCreations/devilndove-site) | `functions/api/_lib/ql364-source-health.mjs` |
| `ai-data-platform` | [RosevearCreations/ai-data-platform](https://github.com/RosevearCreations/ai-data-platform) | `apps/web/lib/ql364-source-health.mjs` |
| `rosevear-ai-hub` | [RosevearCreations/rosevear-ai-hub](https://github.com/RosevearCreations/rosevear-ai-hub) | `server/src/rosevear_ai_hub/api/ql364_source_health.py` |

## Master relationship and connection process

- AI Data Platform is the **master intelligence** plane (health, evidence, completion, performance, analytics). Comms Hub is the **master operations** plane (incident intake, consent-aware routing, human escalation, notification and follow-up). Neither is the tenant database of any app.
- All six other sources are **independent participants**, not unrestricted slaves. Shell-level source registration does **not** grant customer-tenant privileges, GitHub or device control, or API access.
- The real connection path is **contract discovery → original source/signer/witness evidence → protected source-owner and master-owner authorization → receiver and consent verification → scoped signed TEST → independent receipt check → explicit operator state update**. No step is implicitly completed by successful compilation or a chat acknowledgement.
- Existing QL-349 one-source TEST coordination does not persist `CONNECTED`. Original owner receipts and separate per-source private trust must be reconciled before any meaningful live dashboard connection.
- Six source shells are registered; the existing owner drilldown is an **aggregate** connection readback, not six individual probes. In the absence of fresh, individually authenticated proof, report each source as `NOT INDIVIDUALLY VERIFIED / HOLD`.

## QL-404 protected verifier acceptance

The `runtimes/hub-relay/ql404-protected-evidence-gate.mjs` boundary:

1. Requires independently provisioned pinned Ed25519 public keys for distinct source-owner, independent reviewer and master-owner roles. It never asks for private keys or credentials.
2. Verifies a signed, scope-limited `TEST` packet bound to a known source, immutable case/assignment/correlation, 40-character source revision, 32-character nonce and five original artifact SHA-256 digests.
3. Compares each digest to the **actual original bytes passed only within the protected Node process** (each maximum 64 KiB). The bytes are not written or echoed.
4. Cryptographically validates independent reviewer disposition tied to the source signature, then a separate master-owner decision tied to the reviewer. Signature replay, timestamps, source/role drift, changed bytes, missing gate, invalid pins and approval for live access all fail closed.
5. Records used nonces only **in-memory for one verifier instance**. It is not an authoritative persistent replay store; actual production receiver must supply durable replay controls before any TEST authorization.
6. Returns verification metadata only. `connected`, `authorizedTest`, `receiverActivated`, `persisted` and side-effect counts remain false/zero even after valid signatures.

### Owner acceptance before promoting connection from HOLD

- [ ] Original Ree/source owner and Jack/master owner authentication and independently witnessed artifacts are verified through protected processes.
- [ ] Source-specific signing key, receiver enrollment and scope are independently pinned and current.
- [ ] Full source/reviewer/master proof is bound to the same case and TEST purpose.
- [ ] Consent, tenant boundaries, durable replay prevention and private route authorization are checked.
- [ ] Exactly one narrow TEST succeeds with an original authenticated receipt and separate receiver acknowledgement.
- [ ] Owner explicitly approves state transition; source does not auto-promote itself.

None of these tasks is marked complete merely by QL-404 deployment or a handoff issue.
