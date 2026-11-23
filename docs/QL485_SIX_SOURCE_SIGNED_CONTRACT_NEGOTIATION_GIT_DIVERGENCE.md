# QL-485 — Six-Application Signed Contract Negotiation, Source Compatibility and Git Divergence Diagnostics

## Problem and implemented solution

QL-484 delivered genuine-design original-host and Yard Workers private field witness code with original physical-source verification still HOLD. QL-485 adds a runnable, private **six-source version and capability negotiation engine** anchored to the existing QL-333 six-source manifest identities. It **does not** connect applications just because a newer Git commit exists, generate signer keys, change a tenant, send a provider message, activate the private receiver or auto-merge divergent Comms Hub Git histories.

Implemented in:
- runtimes/master-discovery/ql485-signed-release-negotiation.mjs
- runtimes/master-discovery/ql485-private-review-ledger.mjs
- runtimes/master-discovery/ql485-offline-compatibility-cli.mjs
- api/contracts/ql485-source-release-notice-v1.schema.json
- matching Linux and Windows CI tests

**Six known producers:** Yard Workers (yw), iCamp, Rosie Dazzlers, Devil n Dove, AI Data Platform, Rosevear AI Hub. This release extends the six-source discovery contract, not a new discovery endpoint. Source identities, tenant boundaries and source-specific allowed capabilities are fixed from the established QL-333 registry.

## What negotiation checks

Every source signs a short-lived exact QL-485 notice with its Ed25519 original source key. The JSON packet describes immutable source revision, previous source revision, contract version, supported event schemas, source-specific read-only capabilities, original repository, tenant boundary, environment, audience and no customer or authority transfer. Signature uses the QL-333 recursively sorted canonical JSON algorithm, but these are **separate** QL-485 source notices; QL-333 discovery signed/unsigned manifests are not silently upgraded.

The receiver must already have a **separately verified owner-approved pin** containing each source's exact public signer, approved 40-character source Git SHA, major/minor/patch contract version, exact ordered approved schema set and capabilities. No trust-on-first-use, and the same signing key cannot impersonate two separately enrolled source IDs. Exactly matching, current signed metadata produces SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD, never "connected".

Different, independently meaningful states:
- Source revision changes with an approved previous revision: SIGNED_NEW_REVISION_OWNER_REENROLLMENT_REQUIRED. Unanchored revision chains are HOLD.
- Same source revision but schema changed: SIGNED_EVENT_SCHEMA_CHANGE_REVIEW_REQUIRED.
- Same revision but capability changed: SIGNED_CAPABILITY_CHANGE_REVIEW_REQUIRED.
- Contract major changed: HOLD with QL485_MAJOR_VERSION_INCOMPATIBLE; same-major semantic version change receives SIGNED_SEMVER_CHANGE_REVIEW_REQUIRED.
- Invalid signature, impersonated source ID, unfamiliar capability, cross-tenant boundary, unknown field, expired packet, unauthorized audience or customer privilege: HOLD.
- Missing/invalid six-source inputs: MULTISOURCE_CONTRACT_REVIEW_HOLD with per-source reasons.

A separate independent reviewer may cryptographically countersign a proposal for REVIEW_ONLY_OWNER_REENROLLMENT_PENDING, but cannot re-enroll a source or authorize a receiver.

## Diagnostics and reconciliation

The diagnostic function receives specific Comms Hub main/dev SHA and **independently obtained GitHub ahead/behind counts** as caller-provided metadata. Both counts positive means DIVERGED. It compares each source's current reported GitHub head to the *signed source notice*, classifying changes independently. It does not assume application messages create Git commits: external updates can change source software, but **only actual writes to this repository's Git refs produce branch ancestry changes**.

A separate owner-only fsync private ledger writes a bounded, write-once redacted six-source digest report; it rejects session collisions and altered receipt contents. The receipt is an owner-directory integrity check, not independent hardware attestation. CI tests use ephemeral Ed25519 keys and isolated folders; not real source credentials or business records.

A manual offline command can ingest genuine owner-provisioned signed packets and read-only Git comparison metadata from a restricted absolute local JSON file. It cannot fetch a GitHub token, poll external sources or install listeners.

    node .\runtimes\master-discovery\ql485-offline-compatibility-cli.mjs --status

    node .\runtimes\master-discovery\ql485-offline-compatibility-cli.mjs --review "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql485-current-sources.json"

Its private JSON has exactly four top-level keys: packets, pins, git, sourceHeads. The six packet and pin objects follow the QL-485 test fixture and schema, using **real independent owner-approved public signer pins**, not CI test keys. Git metadata must include repository, mainSha, devSha, aheadBy, behindBy, checkedAtMs. The command never prints raw source packets or keys.

## Source heads observed at build planning, November 22, 2026

These are actual observed GitHub branch-head identifiers at that time, **not** proof of source runtime deployment or source owner approval. Re-check before using as current evidence:

| Producer | Observed main revision |
|---|---|
| Yard Workers | 7409a11897fe835c533be7e1f35480f1ccb7ce7e |
| iCamp | 13884dc708b83f4f1f3fde0b00e0c86aeb9bec34 |
| Rosie Dazzlers | 15261b17a50931b9c380ece438d61236054e6950 |
| Devil n Dove | f73a94e65759c66ace44b21cf7b0035b5ac1acf8 |
| AI Data Platform | 9dbf5081443952b51717608035df3bb3e758168d |
| Rosevear AI Hub | 1b129ec504acf41b69bfcebf124d13a978d9f7da |

Comms Hub Git comparison at initial inspection: main-to-dev **543 ahead, 522 behind**, status **diverged**. Git branch comparison is unrelated to normal authenticated runtime messages. The persistent large counts likely arise from independently merged release histories: do not claim a specific root cause without tracing merge ancestry. Avoid merging 500+ unrelated commits to advance a single feature; instead open exact scoped PRs into dev and main and validate both.

## Acceptance and non-negotiable limits

- Linux CI executes QL-485 six identity, independent signer and reviewer, freshness, source compatibility, minor/major version, capability/schema drift, wrong owner pin, cross-tenant, read-only diagnostics and write-once receipt tamper/replay tests.
- Windows CI proves the manual CLI is inert in status and does not allow a hidden server or external file access.
- Keep the QL-336A required gate file untouched, preserve QL-482/483/484 tests, and validate the resulting main production public asset SHA-256 parity.
- A successful build makes **source code/public site GREEN**, not genuine six-source connections, source-authorized change approval, original Windows field certification or customer message delivery.
- All real source signers, manifest keys and version approvals remain held privately by their owners. A source revision change triggers review rather than automatic connection or migration.

**Next proposed:** QL-486 — Durable Six-App Source Contract Registry, Original Source Revision Attestation & Operator Compatibility Console. It should use genuine approved independent source signatures and make the private reports visible to authorized operators without public customer exposure.
