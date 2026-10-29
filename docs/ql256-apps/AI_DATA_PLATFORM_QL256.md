# AI Data Platform — QL-256 connection handoff

**Repository:** [RosevearCreations/ai-data-platform](https://github.com/RosevearCreations/ai-data-platform)  
**Verified original proof:** HTTP 404 on 29 October 2026 at immutable main `c658bce8c207dcbfdf6c9afa5f304428dd3e31d3`  
**Integration:** DISCONNECTED / HOLD (this is separate from app Production GREEN).

## Give the AI Data Platform build maintainer these instructions

1. **Stop the repeat-HOLD loop** and return one of: `SIGNER_NOT_PROVISIONED`, `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED`, `SIGNER_STATUS_UNKNOWN`. This is a real key-provisioning question, not a request for simulated passing tests.
2. Identify the audited *source A* SHA and the GREEN GitHub Actions run for exactly A. Confirm the platform's receiving proof validator understands QL-248: the signed `source_revision=A` is **not** the later commit B containing the proof file.
3. Arrange a real app-specific Ed25519 signer in a private approved secret manager. Obtain a public SPKI SHA-256 fingerprint from a separately trusted, authenticated custodian—not by trusting whatever the signed file says. Ask privately for distinct custodian, witness and reviewer role decisions. Never return private keys or identity documents.
4. Confirm the nonproduction business identity mapping. AI Data Platform is a **consumer/reviewer** in the six-app process; do not grant it direct access to companion production databases.
5. Bring the proposed staged sequence to an independent reviewer: initial provenance and key trust, then independently authenticated TEST-only authorization, genuine read-only GET/denial tests, and final signed evidence. Do not claim the tests occurred while no authorization exists.
6. Once genuinely witnessed evidence exists, publish `docs/integration/ql246-source-proof.json` in descendant proof commit B. Provide full A/B SHA, exact Actions URL, public file HTTP 200, SHA-256 of raw bytes, verified signature/pin, challenge and receipt references. A 404 is still HOLD.
7. Ask for a separate, future max-30-minute TEST-only review for the specific tenant with `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities` only. No external request now.

**Do not:** create new live database integration, read real customer data, change Supabase schemas, run a gateway test without authenticated approval, or label a locally matched signature as trusted custody.

## Return this short report

```text
App: AI Data Platform
Current main SHA:
Signer provisioning decision:
Source A + matching GREEN CI run: NOT_AVAILABLE / verified values
QL-248 two-SHA consumer amendment accepted: YES / NO
Custodian, distinct witness, reviewer: NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED
Proof B + raw digest + independently pinned SPKI: NOT_AVAILABLE / verified values
Owner TEST authorization: NOT_GIVEN
Genuine gateway GET/denial receipts: NOT_RUN
Connection: DISCONNECTED / HOLD
Next concrete blocker:
```

Read [the complete owner walkthrough](../ROSEVEAR_QL256_MASTER_CONNECTION_WALKTHROUGH.md). No messages in this document constitute test or live pilot authorization.
