# Rosevear integration QL-249 — six-app proof publication retest and owner-scoped test-slot preparation

**Forward this to AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp and Rosevear AI Hub. No private credentials or customer data.**

We know the six companion applications are building. The Comms Hub rechecked their newer GitHub source revisions on 28 October 2026, but the public signed QL-246 proof file was **still missing at all six inspected commits**. The evidence is a dated source snapshot, not a current failure verdict. A future commit must be rechecked by its own full SHA.

## What each application should do next

1. Confirm the QL-248 two-commit proof clarification is accepted by the AI Data Platform QL-246 consumer: an earlier **audited/tested source SHA** goes in the existing signed `payload.source_revision`, and the later **proof-bearing commit SHA** is separately pinned by the independent operator. Do not try to embed a Git commit's own SHA inside a file in that commit.
2. Send back the exact 40-hex tested `source_revision` commit and its **matching** green GitHub Actions CI run URL. The run must have `head_sha` equal to that source revision, not a nearby PR/branch commit.
3. Only after a separately authorized nonproduction GET test truly observes all seven denial cases, issue a fresh one-hour owner challenge, sign the unchanged QL-246 public metadata fields and commit `docs/integration/ql246-source-proof.json` at the **later** proof-bearing revision. If genuine evidence is not available, report **PENDING / NO PROOF** instead of generating a fake signed acceptance.
4. Give the operator the full newer proof commit SHA, raw proof byte SHA-256, exact GitHub URL, source SHA and run URL. The operator must independently fetch the proof bytes from GitHub, verify source-to-proof ancestry and CI identity, and check the app's Ed25519 public SPKI SHA-256 pin **via a separate authenticated channel**. The public proof's self-signature alone cannot establish key custody.
5. If a narrow nonproduction test has not been approved yet, report **NOT SCHEDULED**. Owner-approved scope and test-window details must be transmitted privately and separately from a future pilot approval. No Comms Hub runtime or home AI Hub exposure is authorized by this document.

| Application | Repo | Additional restriction |
| --- | --- | --- |
| AI Data Platform | `RosevearCreations/ai-data-platform` | Update the consumer to recognize distinct code/proof SHAs; no direct shared database access |
| Devil n Dove | `RosevearCreations/devilndove-site` | No listing, Etsy, Marketplace or product write operations |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | No booking, gift delivery, payment, live customer contact or SMS |
| Yard Workers | `RosevearCreations/yw` | Independently confirmed company tenant; no payroll, employee, job or dispatch writes |
| iCamp | `RosevearCreations/iCamp` | Independently confirmed campground tenant; no gate, reservation or visitor-access commands |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | Private-only isolated test runner; never publish household IPs, camera/device/vault endpoints |

## Proposed test-window return — no auto-scheduling

Use one response per app with **public nonsecret metadata**:

```text
Application and exact repository:
Current main commit SHA and green CI URL:
Tested source SHA and its exact green source CI run URL:
Later proof-bearing commit SHA / public proof URL / raw SHA-256: PRESENT / MISSING
QL-248 two-SHA clarification adopted by source and AI Data Platform consumer: YES / PENDING
Ed25519 public SPKI fingerprint independently authenticated out of band: VERIFIED / UNVERIFIED
Source-to-proof ancestry and exact CI SHA independently checked: VERIFIED / UNVERIFIED
Original signed nonproduction health/capabilities GET receipts: VERIFIED / PENDING
Seven genuine independently witnessed denial outcomes and original trace IDs: VERIFIED / PENDING
Restart-durable source audit / rotation / revoked-key rollback: VERIFIED / PENDING
Named reviewer and owner-scoped UTC test window: NOT REQUESTED / PENDING OWNER APPROVAL
Test-only endpoint/key IDs (never values) and narrow GET allowlist: NOT PROVISIONED / PENDING
Owner permission for NONPRODUCTION TEST ONLY: NOT GIVEN
Owner permission for READ-ONLY PILOT: NOT GIVEN
Actual Comms Hub connection state: DISCONNECTED / HOLD
Remaining blockers:
```

**Do not paste secrets, HMAC tokens, private Ed25519 keys, personal owner identity evidence, real customer or payroll records, household network details, gate controls or internal database values into ChatGPT, GitHub commits or this handoff.** Missing evidence is an acceptable HOLD result.

## What QL-249 can independently check

Comms Hub QL-249 can perform explicit **public GitHub GET-only** retrieval at the six known repositories. If a signed proof is published, the new tool verifies the public file's signed earlier source SHA against its exact later proof commit, checks source-to-proof ancestry through GitHub's compare API, and confirms the claimed CI run is successful *for the earlier source SHA*. All network requests are bounded to GitHub. It **never** calls an external gateway, accepts an owner approval, or schedules a test window.

Even a fully green GitHub result remains **HOLD** until the distinct independent key-pin verification, authorized server-side nonproduction GETs, durable original audits, true test witnesses and authenticated owner decision are complete.

**Next expected Comms Hub build: QL-250 — Independent Six-App Proof/CI Refresh, Key-Pin Custody Challenge & Owner-Approved Nonproduction GET Window Witnessing (HELD).**
